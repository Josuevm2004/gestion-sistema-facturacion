package com.facturacion.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

public class ProrrateoCalculatorUtil {

    public record ResultadoProrrateo(
            BigDecimal precioPlan,
            int diasTotales,
            int diaCapacitacion,
            int diasNoConsumidos,
            BigDecimal descuento,
            BigDecimal montoFinal
    ) {}

    /**
     * Calculates prorated fee M_cobro = ROUND( P - [ (P / D_total) * (D_cap - 1) ] )
     */
    public static ResultadoProrrateo calcular(BigDecimal precioPlan, LocalDate fechaCapacitacion) {
        if (precioPlan == null || precioPlan.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio del plan no puede ser nulo ni negativo");
        }
        if (fechaCapacitacion == null) {
            throw new IllegalArgumentException("La fecha de capacitación es obligatoria");
        }

        int diasTotales = fechaCapacitacion.lengthOfMonth();
        int diaCapacitacion = fechaCapacitacion.getDayOfMonth();
        int diasNoConsumidos = diaCapacitacion - 1;

        BigDecimal precioDiario = precioPlan.divide(
                BigDecimal.valueOf(diasTotales),
                10,
                RoundingMode.HALF_UP
        );

        BigDecimal descuento = precioDiario.multiply(BigDecimal.valueOf(diasNoConsumidos));
        BigDecimal montoFinalCalculado = precioPlan.subtract(descuento);

        BigDecimal montoFinalRedondeado = montoFinalCalculado.setScale(0, RoundingMode.HALF_UP);

        return new ResultadoProrrateo(
                precioPlan,
                diasTotales,
                diaCapacitacion,
                diasNoConsumidos,
                descuento.setScale(2, RoundingMode.HALF_UP),
                montoFinalRedondeado
        );
    }

    public static ResultadoProrrateo calcularHastaDiaCobro(BigDecimal precioPlan, LocalDate fechaCapacitacion, int diaCobro) {
        if (precioPlan == null || precioPlan.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio del plan no puede ser nulo ni negativo");
        }
        if (fechaCapacitacion == null) {
            throw new IllegalArgumentException("La fecha de capacitaciÃ³n es obligatoria");
        }
        if (diaCobro <= 0) {
            return calcular(precioPlan, fechaCapacitacion);
        }

        LocalDate fechaFinCiclo = calcularFechaFinMensual(fechaCapacitacion, diaCobro);
        LocalDate fechaInicioCiclo = billingDate(fechaFinCiclo.minusMonths(1), diaCobro);

        int diasTotales = Math.max(1, (int) ChronoUnit.DAYS.between(fechaInicioCiclo, fechaFinCiclo));
        int diasCobrados = Math.max(1, (int) ChronoUnit.DAYS.between(fechaCapacitacion, fechaFinCiclo));
        int diasNoConsumidos = Math.max(0, diasTotales - diasCobrados);

        BigDecimal precioDiario = precioPlan.divide(
                BigDecimal.valueOf(diasTotales),
                10,
                RoundingMode.HALF_UP
        );

        BigDecimal montoFinalCalculado = precioDiario.multiply(BigDecimal.valueOf(diasCobrados));
        BigDecimal montoFinalRedondeado = montoFinalCalculado.setScale(0, RoundingMode.HALF_UP);
        BigDecimal descuento = precioPlan.subtract(montoFinalCalculado);

        return new ResultadoProrrateo(
                precioPlan,
                diasTotales,
                fechaCapacitacion.getDayOfMonth(),
                diasNoConsumidos,
                descuento.setScale(2, RoundingMode.HALF_UP),
                montoFinalRedondeado
        );
    }

    public static LocalDate calcularFechaFinMensual(LocalDate fechaInicio, int diaCobro) {
        if (diaCobro <= 0) {
            return fechaInicio.withDayOfMonth(fechaInicio.lengthOfMonth());
        }

        LocalDate candidato = billingDate(fechaInicio, diaCobro);
        if (!fechaInicio.isBefore(candidato)) {
            candidato = billingDate(fechaInicio.plusMonths(1), diaCobro);
        }
        return candidato;
    }

    public static LocalDate billingDate(LocalDate fecha, int diaCobro) {
        YearMonth ym = YearMonth.from(fecha);
        return ym.atDay(Math.min(diaCobro, ym.lengthOfMonth()));
    }
}
