package com.masajes.app.exception;

import com.masajes.app.dto.ErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // =========================================
    // RESOURCE NOT FOUND
    // =========================================
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex
    ) {

        ErrorResponse error = ErrorResponse.builder()
                .error("NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(error);
    }

    // =========================================
    // TURNO CONFLICT
    // =========================================
    @ExceptionHandler(TurnoConflictException.class)
    public ResponseEntity<ErrorResponse> handleTurnoConflict(
            TurnoConflictException ex
    ) {

        ErrorResponse error = ErrorResponse.builder()
                .error("CONFLICT")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(error);
    }

    // =========================================
    // UNAUTHORIZED
    // =========================================
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(
            UnauthorizedException ex
    ) {

        ErrorResponse error = ErrorResponse.builder()
                .error("FORBIDDEN")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(error);
    }

    // =========================================
    // VALIDATION ERRORS (@Valid)
    // =========================================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex
    ) {

        Map<String, String> details = new HashMap<>();

        ex.getBindingResult()
                .getAllErrors()
                .forEach(error -> {

                    String fieldName = ((FieldError) error).getField();
                    String message = error.getDefaultMessage();

                    details.put(fieldName, message);
                });

        ErrorResponse errorResponse = ErrorResponse.builder()
                .error("VALIDATION_ERROR")
                .message("Error de validación")
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    // =========================================
    // GENERAL ERROR
    // =========================================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(
            Exception ex
    ) {

        ErrorResponse error = ErrorResponse.builder()
                .error("INTERNAL_SERVER_ERROR")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
}