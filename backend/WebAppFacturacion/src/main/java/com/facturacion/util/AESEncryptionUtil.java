package com.facturacion.util;

import com.facturacion.exception.EncryptionException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

@Component
public class AESEncryptionUtil {

    private final SecretKeySpec secretKeySpec;

    public AESEncryptionUtil(@Value("${aes.secret-key:MySuperSecretAESKeyForClaveSOL256!}") String secret) {
        try {
            byte[] key = secret.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            key = sha.digest(key);
            key = Arrays.copyOf(key, 32);
            this.secretKeySpec = new SecretKeySpec(key, "AES");
        } catch (Exception e) {
            throw new EncryptionException("Error al inicializar clave de cifrado AES-256", e);
        }
    }

    public String encrypt(String value) {
        if (value == null || value.isEmpty()) return value;
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new EncryptionException("Error al encriptar la Clave SOL", e);
        }
    }

    public String decrypt(String encryptedValue) {
        if (encryptedValue == null || encryptedValue.isEmpty()) return encryptedValue;
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedValue.trim());
            byte[] original = cipher.doFinal(decodedBytes);
            return new String(original, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return encryptedValue;
        }
    }
}
