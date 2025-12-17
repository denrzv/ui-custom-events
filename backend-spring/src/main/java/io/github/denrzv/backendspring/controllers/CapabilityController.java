package io.github.denrzv.backendspring.controllers;

import io.github.denrzv.backendspring.api.CapabilityIssueRequest;
import io.github.denrzv.backendspring.api.CapabilityIssueResponse;
import io.github.denrzv.backendspring.capability.CapabilityRecord;
import io.github.denrzv.backendspring.capability.CapabilityService;
import io.github.denrzv.backendspring.security.UserContext;
import io.github.denrzv.backendspring.security.UserContextResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CapabilityController {

  private final CapabilityService capabilityService;
  private final UserContextResolver resolver;

  public CapabilityController(CapabilityService capabilityService, UserContextResolver resolver) {
    this.capabilityService = capabilityService;
    this.resolver = resolver;
  }

  @PostMapping("/capabilities")
  public CapabilityIssueResponse issue(@RequestBody CapabilityIssueRequest req, HttpServletRequest http) {
    UserContext user = resolver.resolve(http);
    CapabilityRecord rec = capabilityService.issue(user, req);
    long expiresIn = java.time.Duration.between(java.time.Instant.now(), rec.expiresAt).toSeconds();
    if (expiresIn < 0) expiresIn = 0;
    return new CapabilityIssueResponse(rec.capabilityId, expiresIn);
  }
}