package com.facturacion.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    private static final DateTimeFormatter MONTH_YEAR_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public static String getCurrentPeriod() {
        return LocalDateTime.now().format(MONTH_YEAR_FORMATTER);
    }

    public static String formatPeriod(LocalDateTime date) {
        if (date == null) return getCurrentPeriod();
        return date.format(MONTH_YEAR_FORMATTER);
    }
}
