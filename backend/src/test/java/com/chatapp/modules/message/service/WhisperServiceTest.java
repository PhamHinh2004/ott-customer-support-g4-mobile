package com.chatapp.modules.message.service;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WhisperServiceTest {

    private HttpServer server;
    private WhisperService whisperService;
    private int port;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        port = server.getAddress().getPort();
        whisperService = new WhisperService(new RestTemplate());
        ReflectionTestUtils.setField(whisperService, "whisperUrl", "http://127.0.0.1:" + port + "/transcribe");
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void transcribeWithMetadata_sendsMultipartFileAndParsesDetectedLanguage() {
        AtomicReference<String> receivedBody = new AtomicReference<>();

        server.createContext("/transcribe", exchange -> {
            byte[] reqBytes = exchange.getRequestBody().readAllBytes();
            receivedBody.set(new String(reqBytes, StandardCharsets.UTF_8));
            byte[] response = "{\"text\":\"Xin chào\",\"language\":\"vi\",\"nllb_language\":\"vie_Latn\"}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        });
        server.start();

        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.m4a", "audio/mp4", "dummy-audio-content".getBytes(StandardCharsets.UTF_8));

        WhisperService.TranscriptionResult result = whisperService.transcribeWithMetadata(file, "vi");

        assertEquals("Xin chào", result.text());
        assertEquals("vi", result.language());
        assertEquals("vie_Latn", result.nllbLanguage());
        assertTrue(receivedBody.get().contains("sample.m4a"));
        assertTrue(receivedBody.get().contains("dummy-audio-content"));
    }

    @Test
    void transcribeFromUrl_downloadsAudioAndForwardsToWhisper() {
        byte[] fakeAudio = "RIFF-fake-wav-data".getBytes(StandardCharsets.UTF_8);

        server.createContext("/voice.wav", exchange -> {
            exchange.getResponseHeaders().add("Content-Type", "audio/wav");
            exchange.sendResponseHeaders(200, fakeAudio.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fakeAudio);
            }
        });
        server.createContext("/transcribe", exchange -> {
            byte[] reqBytes = exchange.getRequestBody().readAllBytes();
            String body = new String(reqBytes, StandardCharsets.UTF_8);
            assertTrue(body.contains("RIFF-fake-wav-data"));
            byte[] response = "{\"text\":\"Hello world\",\"language\":\"en\",\"nllb_language\":\"eng_Latn\"}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        });
        server.start();

        WhisperService.TranscriptionResult result =
                whisperService.transcribeFromUrl("http://127.0.0.1:" + port + "/voice.wav?sig=123", null);

        assertEquals("Hello world", result.text());
        assertEquals("en", result.language());
        assertEquals("eng_Latn", result.nllbLanguage());
    }
}
