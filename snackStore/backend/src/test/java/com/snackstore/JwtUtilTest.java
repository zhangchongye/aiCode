package com.snackstore;

import com.snackstore.common.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JwtUtilTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void generateAndParseToken_roundTrip() {
        String token = jwtUtil.generateToken(1L, "ADMIN");
        assertNotNull(token);
        assertEquals(1L, jwtUtil.parseToken(token).get("userId", Long.class));
        assertEquals("ADMIN", jwtUtil.parseToken(token).get("role", String.class));
    }

    @Test
    void parseInvalidToken_throws() {
        assertThrows(Exception.class, () -> jwtUtil.parseToken("invalid.token.here"));
    }
}
