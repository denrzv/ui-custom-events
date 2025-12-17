package io.github.denrzv.backendspring.ratelimit;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

public class SlidingWindowRateLimiter {

  private final ConcurrentHashMap<String, Deque<Long>> buckets = new ConcurrentHashMap<>();
  private final int limit;
  private final Duration window;
  private final Clock clock;

  public SlidingWindowRateLimiter(int limit, Duration window, Clock clock) {
    this.limit = limit;
    this.window = window;
    this.clock = clock;
  }

  public boolean tryAcquire(String key) {
    long now = clock.millis();
    long cutoff = now - window.toMillis();

    Deque<Long> q = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());

    synchronized (q) {
      while (!q.isEmpty() && q.peekFirst() < cutoff) q.pollFirst();
      if (q.size() >= limit) return false;
      q.addLast(now);
      return true;
    }
  }
}