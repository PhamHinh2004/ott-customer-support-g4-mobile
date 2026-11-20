package com.chatapp.modules.message.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhisperService {

    private final RestTemplate restTemplate;

    @Value("${app.whisper.url:http://localhost:8000/transcribe}")
    private String whisperUrl;

    public record TranscriptionResult(String text, String language, String nllbLanguage) {}

    public String transcribe(MultipartFile file) {
        return transcribeWithMetadata(file, null).text();
    }

    public TranscriptionResult transcribeWithMetadata(MultipartFile file, String language) {
        try {
            byte[] bytes = file.getBytes();
            String filename = (file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank())
                    ? file.getOriginalFilename()
                    : "audio.m4a";

            return sendToWhisper(bytes, filename, file.getContentType(), language);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read audio file for transcription: " + e.getMessage(), e);
        }
    }

    public TranscriptionResult transcribeFromUrl(String url, String language) {
        try {
            byte[] audioBytes = downloadAudioBytes(url);
            String filename = extractFilenameFromUrl(url);
            String contentType = detectContentType(filename);
            return sendToWhisper(audioBytes, filename, contentType, language);
        } catch (Exception e) {
            throw new RuntimeException("Failed to transcribe audio from URL: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private TranscriptionResult sendToWhisper(byte[] bytes, String filename, String contentType, String language) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(
                    (contentType != null && !contentType.isBlank()) ? contentType : detectContentType(filename)));

            ByteArrayResource fileResource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new HttpEntity<>(fileResource, fileHeaders));
            if (language != null && !language.isBlank()) {
                body.add("language", language.trim());
            }

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            log.info("Calling Whisper STT at {} for file={} ({} bytes)", whisperUrl, filename, bytes.length);
            ResponseEntity<Map> response = restTemplate.postForEntity(whisperUrl, request, Map.class);

            Map<String, Object> respBody = response.getBody();
            if (respBody == null) {
                throw new RuntimeException("Empty response from Whisper service");
            }
            String text = respBody.get("text") != null ? respBody.get("text").toString() : "";
            String detectedLang = respBody.get("language") != null ? respBody.get("language").toString() : "vi";
            String nllbLang = respBody.get("nllb_language") != null ? respBody.get("nllb_language").toString() : "vie_Latn";

            return new TranscriptionResult(text, detectedLang, nllbLang);
        } catch (Exception e) {
            log.error("Whisper transcription failed at {}: {}", whisperUrl, e.getMessage());
            throw new RuntimeException("Whisper transcription failed: " + e.getMessage(), e);
        }
    }

    private byte[] downloadAudioBytes(String audioUrl) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) URI.create(audioUrl).toURL().openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(30000);
        conn.setRequestProperty("User-Agent", "ChatApp-Backend/1.0");
        int status = conn.getResponseCode();
        if (status < 200 || status >= 300) {
            throw new IOException("HTTP " + status + " while downloading audio");
        }
        try (InputStream in = conn.getInputStream()) {
            return in.readAllBytes();
        } finally {
            conn.disconnect();
        }
    }

    private String extractFilenameFromUrl(String url) {
        String path = url;
        int queryIdx = path.indexOf('?');
        if (queryIdx > 0) {
            path = path.substring(0, queryIdx);
        }
        String lower = path.toLowerCase();
        if (lower.endsWith(".webm")) return "audio.webm";
        if (lower.endsWith(".mp3")) return "audio.mp3";
        if (lower.endsWith(".m4a")) return "audio.m4a";
        if (lower.endsWith(".mp4")) return "audio.mp4";
        if (lower.endsWith(".ogg")) return "audio.ogg";
        if (lower.endsWith(".opus")) return "audio.opus";
        if (lower.endsWith(".aac")) return "audio.aac";
        if (lower.endsWith(".wav")) return "audio.wav";
        return "audio.m4a";
    }

    private String detectContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".webm")) return "audio/webm";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".m4a")) return "audio/mp4";
        if (lower.endsWith(".mp4")) return "audio/mp4";
        if (lower.endsWith(".ogg") || lower.endsWith(".opus")) return "audio/ogg";
        if (lower.endsWith(".aac")) return "audio/aac";
        if (lower.endsWith(".wav")) return "audio/wav";
        return "audio/mp4";
    }
}
