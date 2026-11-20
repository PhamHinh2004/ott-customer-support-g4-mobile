package com.chatapp.modules.message.service;

import com.chatapp.modules.message.dto.TranslationTask;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationBatchService {
    private static final String MYMEMORY_URL = "https://api.mymemory.translated.net/get";
    private static final Map<String, String> NLLB_TO_ISO = Map.ofEntries(
            Map.entry("vie_Latn", "vi"),
            Map.entry("eng_Latn", "en"),
            Map.entry("zho_Hans", "zh-CN"),
            Map.entry("fra_Latn", "fr"),
            Map.entry("deu_Latn", "de"),
            Map.entry("jpn_Jpan", "ja"),
            Map.entry("kor_Hang", "ko"),
            Map.entry("tha_Thai", "th"),
            Map.entry("ind_Latn", "id"),
            Map.entry("spa_Latn", "es"),
            Map.entry("por_Latn", "pt"),
            Map.entry("rus_Cyrl", "ru")
    );

    private final RestTemplate restTemplate;

    @Value("${app.translation.service-url}")
    private String translationServiceUrl;

    @Value("${app.translation.batch-size}")
    private int maxBatchSize;

    private final CopyOnWriteArrayList<TranslationTask> queue = new CopyOnWriteArrayList<>();

    // ─── PUBLIC API ───────────────────────────────────────────────────────────

    /**
     * Dịch 1 text — đẩy vào queue, trả CompletableFuture.
     * Sẽ được resolve sau tối đa 100ms khi queue flush.
     */
    public CompletableFuture<String> translate(String text, String srcLang, String tgtLang) {
        TranslationTask task = new TranslationTask(text, srcLang, tgtLang);
        queue.add(task);
        return task.getFuture();
    }

    /**
     * Dịch nhiều text cùng lúc — gọi thẳng batch API, không qua queue.
     * Dùng khi load lịch sử hội thoại (translateMessages).
     */
    public CompletableFuture<List<String>> translateBatch(List<String> texts, String srcLang, String tgtLang) {
        return CompletableFuture.supplyAsync(() -> callBatchApi(texts, srcLang, tgtLang));
    }

    // ─── SCHEDULED FLUSH ─────────────────────────────────────────────────────

    /**
     * Flush queue mỗi 100ms.
     * Group theo cặp ngôn ngữ → mỗi nhóm gọi 1 HTTP request.
     */
    @Scheduled(fixedDelay = 100)
    public void flushQueue() {
        if (queue.isEmpty()) return;

        List<TranslationTask> batch = new ArrayList<>();
        for (int i = 0; i < maxBatchSize && !queue.isEmpty(); i++) {
            TranslationTask task = queue.remove(0);
            if (task != null) batch.add(task);
        }

        if (batch.isEmpty()) return;

        log.debug("Flushing translation batch: {} tasks", batch.size());

        // Group theo "srcLang→tgtLang" để tối thiểu số HTTP call
        Map<String, List<TranslationTask>> grouped = new HashMap<>();
        for (TranslationTask task : batch) {
            String key = task.getSrcLang() + "→" + task.getTgtLang();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(task);
        }

        for (Map.Entry<String, List<TranslationTask>> entry : grouped.entrySet()) {
            List<TranslationTask> group = entry.getValue();
            String[] langs = entry.getKey().split("→");

            try {
                List<String> texts = group.stream().map(TranslationTask::getText).toList();
                List<String> results = callBatchApi(texts, langs[0], langs[1]);

                for (int i = 0; i < group.size(); i++) {
                    group.get(i).getFuture().complete(
                            i < results.size() ? results.get(i) : group.get(i).getText()
                    );
                }
            } catch (Exception e) {
                log.error("Batch translation failed for {}: {}", entry.getKey(), e.getMessage());
                // Fallback: complete với text gốc để không block UI
                group.forEach(t -> t.getFuture().complete(t.getText()));
            }
        }
    }

    // ─── PRIVATE ─────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<String> callBatchApi(List<String> texts, String srcLang, String tgtLang) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        if (srcLang != null && srcLang.equals(tgtLang)) {
            return new ArrayList<>(texts);
        }

        log.info("Calling Python Batch API at {} for {} texts", translationServiceUrl, texts.size());
        var requestBody = Map.of(
                "items", texts.stream()
                        .map(t -> Map.of("text", t, "src", srcLang, "tgt", tgtLang))
                        .toList()
        );

        try {
            List<String> result = restTemplate.postForObject(
                    translationServiceUrl + "/translate/batch",
                    requestBody,
                    List.class
            );
            log.info("Python API returned {} results", result != null ? result.size() : 0);
            if (result != null && result.size() == texts.size()) {
                return result;
            }
        } catch (Exception e) {
            log.warn("Python Batch API unavailable ({}), falling back to MyMemory API", e.getMessage());
        }

        return translateWithMyMemoryFallback(texts, srcLang, tgtLang);
    }

    private String toIsoCode(String code) {
        if (code == null || code.isBlank()) {
            return "en";
        }
        if (NLLB_TO_ISO.containsKey(code)) {
            return NLLB_TO_ISO.get(code);
        }
        int underscore = code.indexOf('_');
        return underscore > 0 ? code.substring(0, Math.min(2, underscore)) : code;
    }

    @SuppressWarnings("unchecked")
    private List<String> translateWithMyMemoryFallback(List<String> texts, String srcLang, String tgtLang) {
        String srcIso = toIsoCode(srcLang);
        String tgtIso = toIsoCode(tgtLang);
        if (srcIso.equals(tgtIso)) {
            return new ArrayList<>(texts);
        }

        List<String> translatedList = new ArrayList<>(texts.size());
        for (String text : texts) {
            if (text == null || text.isBlank()) {
                translatedList.add(text);
                continue;
            }
            try {
                String q = text.length() > 500 ? text.substring(0, 500) : text;
                String langPair = srcIso + "|" + tgtIso;
                String url = MYMEMORY_URL
                        + "?q=" + URLEncoder.encode(q, StandardCharsets.UTF_8)
                        + "&langpair=" + URLEncoder.encode(langPair, StandardCharsets.UTF_8);

                Map<String, Object> response = restTemplate.getForObject(URI.create(url), Map.class);
                if (response != null && response.get("responseData") instanceof Map<?, ?> responseData) {
                    Object statusObj = response.get("responseStatus");
                    int statusCode = statusObj instanceof Number num ? num.intValue() : 200;
                    Object translatedObj = responseData.get("translatedText");
                    if (statusCode == 200 && translatedObj instanceof String translated && !translated.isBlank()) {
                        translatedList.add(translated);
                        continue;
                    }
                }
            } catch (Exception ex) {
                log.warn("MyMemory fallback failed for text: {}", ex.getMessage());
            }
            translatedList.add(text);
        }
        return translatedList;
    }
}
