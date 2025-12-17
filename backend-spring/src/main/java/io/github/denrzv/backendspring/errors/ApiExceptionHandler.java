package io.github.denrzv.backendspring.errors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiErrorResponse> handle(ApiException ex) {
    return ResponseEntity.status(ex.status())
      .body(new ApiErrorResponse(ex.reasonCode(), ex.getMessage()));
  }
}