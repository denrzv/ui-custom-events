package io.github.denrzv.backendspring;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DataController {

    @GetMapping("/data")
    public Map<String, Object> data(@RequestParam(defaultValue = "") String filter) {
        return Map.of(
                "filter", filter,
                "serverTime", Instant.now().toString(),
                "items", List.of(
                        Map.of("id", 1, "text", "Item A (" + filter + ")"),
                        Map.of("id", 2, "text", "Item B (" + filter + ")")
                )
        );
    }

    @GetMapping("/version")
    public Map<String, Object> version() {
        return Map.of("version", Instant.now().toEpochMilli());
    }
}