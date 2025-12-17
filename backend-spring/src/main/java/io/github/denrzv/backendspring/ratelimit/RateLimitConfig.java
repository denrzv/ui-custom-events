package io.github.denrzv.backendspring.ratelimit;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.Duration;

@Configuration
public class RateLimitConfig {

  @Bean
  public SlidingWindowRateLimiter capabilityIssueLimiter() {
    return new SlidingWindowRateLimiter(3, Duration.ofSeconds(30), Clock.systemUTC());
  }
}