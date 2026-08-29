package com.facturacion;

import com.facturacion.util.ProrrateoCalculatorUtil;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProrrateoCalculatorUtilTest {

    @Test
    void calculaSegundoProrrateoDeQuinceDeEneroConPlanDeDiecinueve() {
        ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                ProrrateoCalculatorUtil.calcularSegundoProrrateo(
                        new BigDecimal("19.00"),
                        LocalDate.of(2026, 1, 15)
                );

        assertEquals(LocalDate.of(2026, 2, 15), resultado.fechaInicio());
        assertEquals(LocalDate.of(2026, 2, 28), resultado.fechaFin());
        assertEquals(14, resultado.diasProrrateados());
        assertEquals(new BigDecimal("9.50"), resultado.montoAdicional());
    }

    @Test
    void usaLosDiasRealesDelMesSiguienteEnAnioBisiesto() {
        ProrrateoCalculatorUtil.ResultadoSegundoProrrateo resultado =
                ProrrateoCalculatorUtil.calcularSegundoProrrateo(
                        new BigDecimal("19.00"),
                        LocalDate.of(2028, 1, 15)
                );

        assertEquals(LocalDate.of(2028, 2, 29), resultado.fechaFin());
        assertEquals(15, resultado.diasProrrateados());
        assertEquals(new BigDecimal("9.83"), resultado.montoAdicional());
    }
}
