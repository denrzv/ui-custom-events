package io.github.denrzv.backendspring.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class UserContextResolver {

  public UserContext resolve(HttpServletRequest req) {
    // В реальности: claims из JWT
    String userId = headerOrDefault(req, "X-User-Id", "operator-1");
    String role = headerOrDefault(req, "X-Role", "OPERATOR");
    return new UserContext(userId, role);
  }

  private static String headerOrDefault(HttpServletRequest req, String name, String def) {
    String v = req.getHeader(name);
    return (v == null || v.isBlank()) ? def : v.trim();
  }
}