package com.tealeafledger.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Arrays;

public final class TOTPUtil {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int SECRET_BYTES = 20;
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private TOTPUtil() {}

    public static String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        RANDOM.nextBytes(bytes);
        return base32Encode(bytes);
    }

    public static String issuer() {
        return "TeaLeafLedger";
    }

    public static String otpauthUrl(String secret, String account) {
        return "otpauth://totp/"
                + issuer() + ":" + account
                + "?secret=" + secret
                + "&issuer=" + issuer()
                + "&algorithm=SHA1&digits=6&period=30";
    }

    public static boolean verify(String secret, String code) {
        if (secret == null || code == null || code.isBlank()) {
            return false;
        }
        String expected = generateCode(secret, currentTimeStep());
        String current = code.trim();
        String adjacent = generateCode(secret, currentTimeStep() - 1);
        String ahead = generateCode(secret, currentTimeStep() + 1);
        return constantTimeEquals(expected, current)
                || constantTimeEquals(adjacent, current)
                || constantTimeEquals(ahead, current);
    }

    public static String generateCode(String secret, long timeStep) {
        byte[] key = base32Decode(secret);
        byte[] data = new byte[8];
        long value = timeStep;
        for (int i = 7; i >= 0; i--) {
            data[i] = (byte) (value & 0xFF);
            value >>= 8;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            long binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            return String.format("%06d", binary % 1_000_000);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP generation failed", e);
        }
    }

    private static long currentTimeStep() {
        return System.currentTimeMillis() / 1000 / 30;
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    private static String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0;
        int bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bits += 8;
            while (bits >= 5) {
                sb.append(BASE32_ALPHABET.charAt((buffer >> (bits - 5)) & 0x1F));
                bits -= 5;
            }
        }
        if (bits > 0) {
            sb.append(BASE32_ALPHABET.charAt((buffer << (5 - bits)) & 0x1F));
        }
        return sb.toString();
    }

    private static byte[] base32Decode(String data) {
        String normalized = data.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int bits = 0;
        int buffer = 0;
        byte[] bytes = new byte[normalized.length() * 5 / 8];
        int index = 0;
        for (char c : normalized.toCharArray()) {
            buffer = (buffer << 5) | (BASE32_ALPHABET.indexOf(c) & 0x1F);
            bits += 5;
            if (bits >= 8) {
                bytes[index++] = (byte) ((buffer >> (bits - 8)) & 0xFF);
                bits -= 8;
            }
        }
        return Arrays.copyOf(bytes, index);
    }
}