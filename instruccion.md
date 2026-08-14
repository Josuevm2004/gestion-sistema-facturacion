Sí. Y aquí hay una precisión importante: **el prorrateo no debería calcularse únicamente en JavaScript**. JavaScript puede mostrar el cálculo en pantalla, pero el cálculo definitivo debería estar en **Java/Spring Boot**, porque es la parte que realmente registra la venta y evita que alguien manipule el monto desde el navegador.

Para tu sistema yo lo estructuraría así:

```text
Capacitación
      ↓
Java recibe fecha + precio
      ↓
Calcula prorrateo
      ↓
Guarda fecha_inicio
      ↓
Guarda monto_prorrateado
      ↓
Guarda monto_total
      ↓
Cliente → HABILITADO
```

Y para las alertas:

```text
Servicio activo
      ↓
Java revisa fecha_fin
      ↓
¿Falta 1 día?
      ↓
VENCIMIENTO_MAÑANA

¿Ya venció?
      ↓
VENCIDO
```

## 1. Clase para calcular el prorrateo

Usaría `BigDecimal`, **no `double`**, porque estamos trabajando con dinero.

```java
package com.facturacion.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public class ProrrateoUtil {

    /**
     * Calcula el monto del primer cobro según la fecha
     * de capacitación.
     *
     * Fórmula:
     *
     * M = ROUND(
     *      P - ((P / Dtotal) * (Dcap - 1))
     * )
     *
     * @param precioPlan Precio mensual del plan
     * @param fechaCapacitacion Fecha en la que se capacitó al cliente
     * @return Resultado del prorrateo
     */
    public static ResultadoProrrateo calcular(
            BigDecimal precioPlan,
            LocalDate fechaCapacitacion) {

        if (precioPlan == null || precioPlan.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "El precio del plan no puede ser negativo"
            );
        }

        if (fechaCapacitacion == null) {
            throw new IllegalArgumentException(
                    "La fecha de capacitación es obligatoria"
            );
        }

        // Cantidad total de días del mes
        int diasTotales = fechaCapacitacion.lengthOfMonth();

        // Día de capacitación
        int diaCapacitacion = fechaCapacitacion.getDayOfMonth();

        // Días no consumidos
        int diasNoConsumidos = diaCapacitacion - 1;

        // Precio diario
        BigDecimal precioDiario = precioPlan
                .divide(
                        BigDecimal.valueOf(diasTotales),
                        10,
                        RoundingMode.HALF_UP
                );

        // Descuento por días no consumidos
        BigDecimal descuento = precioDiario
                .multiply(BigDecimal.valueOf(diasNoConsumidos));

        // Monto final
        BigDecimal montoFinal = precioPlan.subtract(descuento);

        // Redondear a entero
        montoFinal = montoFinal.setScale(
                0,
                RoundingMode.HALF_UP
        );

        return new ResultadoProrrateo(
                precioPlan,
                diasTotales,
                diaCapacitacion,
                diasNoConsumidos,
                descuento,
                montoFinal
        );
    }

    public record ResultadoProrrateo(
            BigDecimal precioPlan,
            int diasTotales,
            int diaCapacitacion,
            int diasNoConsumidos,
            BigDecimal descuento,
            BigDecimal montoFinal
    ) {
    }
}
```

---

# 2. Ejemplo

Supongamos:

```text
Plan Emprende
Precio mensual: S/ 29

Capacitación:
15/08/2026
```

Agosto tiene:

```text
31 días
```

Entonces:

```text
P = 29
Dtotal = 31
Dcap = 15
```

Días no consumidos:

```text
15 - 1 = 14
```

Precio diario:

```text
29 / 31 = 0.93548...
```

Descuento:

```text
0.93548 × 14
= 13.0967
```

Cobro:

```text
29 - 13.0967
= 15.9032
```

Redondeado:

```text
S/ 16
```

Por tanto:

```text
Precio normal:       S/ 29
Descuento:          S/ 13.10 aprox.
Primer cobro:        S/ 16
```

Y el siguiente mes:

```text
S/ 29
```

sin prorrateo.

---

# 3. Servicio para utilizar el cálculo

Ahora lo meteríamos en Spring Boot:

```java
package com.facturacion.service;

import com.facturacion.util.ProrrateoUtil;
import com.facturacion.util.ProrrateoUtil.ResultadoProrrateo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class ProrrateoService {

    public ResultadoProrrateo calcularPrimerCobro(
            BigDecimal precioPlan,
            LocalDate fechaCapacitacion) {

        return ProrrateoUtil.calcular(
                precioPlan,
                fechaCapacitacion
        );
    }
}
```

---

# 4. Cuando capacitas al cliente

Aquí está la parte realmente importante.

Imaginemos que tienes:

```text
Cliente: ABC SAC
Plan: Emprende
Precio: S/ 29
Estado: POR_CAPACITAR
```

Cuando el administrador presiona:

> **Capacitar cliente**

Java debería hacer algo parecido a esto:

```java
@Service
public class CapacitacionService {

    private final ProrrateoService prorrateoService;

    public CapacitacionService(
            ProrrateoService prorrateoService) {

        this.prorrateoService = prorrateoService;
    }

    public void capacitarCliente(
            BigDecimal precioPlan,
            LocalDate fechaCapacitacion) {

        ResultadoProrrateo resultado =
                prorrateoService.calcularPrimerCobro(
                        precioPlan,
                        fechaCapacitacion
                );

        System.out.println(
                "Precio del plan: S/ "
                        + resultado.precioPlan()
        );

        System.out.println(
                "Días del mes: "
                        + resultado.diasTotales()
        );

        System.out.println(
                "Día capacitación: "
                        + resultado.diaCapacitacion()
        );

        System.out.println(
                "Días no consumidos: "
                        + resultado.diasNoConsumidos()
        );

        System.out.println(
                "Descuento: S/ "
                        + resultado.descuento()
        );

        System.out.println(
                "Primer cobro: S/ "
                        + resultado.montoFinal()
        );
    }
}
```

Pero en tu aplicación real, además de calcularlo, debes **actualizar el servicio y el cliente** dentro de una transacción.

---

# 5. Fecha de inicio del servicio

Aquí hay una regla que quiero mantener exactamente como la explicaste:

> **El servicio comienza el día de capacitación.**

Por ejemplo:

```text
Pago:          10/08/2026
Capacitación:  15/08/2026
Inicio:        15/08/2026
```

No:

```text
Inicio = 10/08
```

sino:

```text
Inicio = 15/08
```

---

# 6. ¿Hasta cuándo dura?

Para un plan mensual, por ejemplo:

```text
Capacitación: 15/08/2026
```

El primer período sería especial por el prorrateo y posteriormente el cliente entra a su ciclo normal.

Aquí te recomiendo que **no intentes deducir siempre la fecha de vencimiento solamente desde `fecha_capacitacion`**.

Guarda explícitamente:

```text
fecha_inicio
fecha_fin
```

porque eso evita muchos problemas cuando posteriormente haya:

* renovación
* cambio de plan
* bloqueo
* devolución de acceso
* prorrateo a mitad de mes.

---

# 7. Alertas de vencimiento

Ahora vamos a la otra parte.

Tu sistema necesita:

### Un día antes

```text
⚠️ El cliente ABC SAC vence mañana.
```

### El día del vencimiento

```text
⚠️ El cliente ABC SAC vence hoy.
```

### Después

```text
🔴 El cliente ABC SAC está vencido.
```

Yo no dependería de JavaScript para detectar esto.

**JavaScript solamente debería mostrar las alertas.**

La detección debe hacerla Java.

---

# 8. Servicio de alertas

```java
package com.facturacion.service;

import com.facturacion.entity.ServicioCliente;
import com.facturacion.repository.ServicioClienteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AlertaService {

    private final ServicioClienteRepository servicioRepository;

    public AlertaService(
            ServicioClienteRepository servicioRepository) {

        this.servicioRepository = servicioRepository;
    }

    public void revisarVencimientos() {

        LocalDate hoy = LocalDate.now();

        LocalDate manana = hoy.plusDays(1);

        // ==========================================
        // 1. CLIENTES QUE VENCEN MAÑANA
        // ==========================================

        List<ServicioCliente> vencenManana =
                servicioRepository
                        .buscarActivosQueVencen(manana);

        for (ServicioCliente servicio : vencenManana) {

            crearAlertaVencimientoManana(servicio);
        }

        // ==========================================
        // 2. CLIENTES QUE VENCEN HOY
        // ==========================================

        List<ServicioCliente> vencenHoy =
                servicioRepository
                        .buscarActivosQueVencen(hoy);

        for (ServicioCliente servicio : vencenHoy) {

            crearAlertaVenceHoy(servicio);
        }

        // ==========================================
        // 3. CLIENTES YA VENCIDOS
        // ==========================================

        List<ServicioCliente> vencidos =
                servicioRepository
                        .buscarActivosVencidos(hoy);

        for (ServicioCliente servicio : vencidos) {

            marcarComoVencido(servicio);
        }
    }


    private void crearAlertaVencimientoManana(
            ServicioCliente servicio) {

        System.out.println(
                "⚠️ El cliente "
                        + servicio.getCliente().getRazonSocial()
                        + " vence mañana."
        );

        // Aquí posteriormente guardarás
        // la notificación en la tabla notificacion.
    }


    private void crearAlertaVenceHoy(
            ServicioCliente servicio) {

        System.out.println(
                "⚠️ El cliente "
                        + servicio.getCliente().getRazonSocial()
                        + " vence hoy."
        );
    }


    private void marcarComoVencido(
            ServicioCliente servicio) {

        servicio.setEstado(
                ServicioCliente.Estado.VENCIDO
        );

        servicioRepository.save(servicio);

        System.out.println(
                "🔴 Cliente vencido: "
                        + servicio.getCliente().getRazonSocial()
        );
    }
}
```

---

# 9. Repository

Con Spring Data JPA:

```java
package com.facturacion.repository;

import com.facturacion.entity.ServicioCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ServicioClienteRepository
        extends JpaRepository<ServicioCliente, Long> {

    @Query("""
        SELECT s
        FROM ServicioCliente s
        WHERE s.estado = 'ACTIVO'
        AND DATE(s.fechaFin) = :fecha
    """)
    List<ServicioCliente> buscarActivosQueVencen(
            LocalDate fecha
    );


    @Query("""
        SELECT s
        FROM ServicioCliente s
        WHERE s.estado = 'ACTIVO'
        AND DATE(s.fechaFin) < :fecha
    """)
    List<ServicioCliente> buscarActivosVencidos(
            LocalDate fecha
    );
}
```

Hay que ajustar la consulta si `fechaFin` es `LocalDate` en lugar de `LocalDateTime`. De hecho, **para tu caso recomiendo `LocalDate` para fechas de período**, porque no necesitas hora para determinar el vencimiento.

---

# 10. Automatizar la revisión

Spring Boot tiene `@Scheduled`.

Entonces puedes hacer:

```java
package com.facturacion.scheduler;

import com.facturacion.service.AlertaService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertaScheduler {

    private final AlertaService alertaService;

    public AlertaScheduler(
            AlertaService alertaService) {

        this.alertaService = alertaService;
    }

    // Todos los días a las 08:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void revisarVencimientos() {

        alertaService.revisarVencimientos();
    }
}
```

Y en tu aplicación:

```java
@SpringBootApplication
@EnableScheduling
public class SistemaFacturacionApplication {

    public static void main(String[] args) {

        SpringApplication.run(
                SistemaFacturacionApplication.class,
                args
        );
    }
}
```

Así Java automáticamente ejecutará:

```text
08:00
   ↓
Revisar vencimientos
   ↓
Vence mañana → crear alerta
Vence hoy    → crear alerta
Ya venció    → cambiar a VENCIDO
```

---

# 11. Evitar alertas duplicadas

Esto es **muy importante**.

No queremos que cada vez que se ejecute el scheduler cree:

```text
⚠️ ABC vence mañana
⚠️ ABC vence mañana
⚠️ ABC vence mañana
⚠️ ABC vence mañana
```

Por eso la tabla `notificacion` debería tener alguna forma de identificar la alerta.

Yo agregaría:

```sql
ALTER TABLE notificacion
ADD COLUMN referencia VARCHAR(100) NULL;
```

Por ejemplo:

```text
VENCIMIENTO_MANANA-Servicio-25-2026-08-15
```

Antes de crearla:

```java
if (!notificacionRepository
        .existsByReferencia(referencia)) {

    // crear notificación
}
```

Así solo existe una alerta.

---

# 12. JavaScript

Ahora sí entra JavaScript.

El JavaScript **no calcula el vencimiento por su cuenta**.

Pregunta al backend:

```text
GET /api/notificaciones
```

y recibe:

```json
[
    {
        "id": 1,
        "tipo": "VENCIMIENTO_MANANA",
        "titulo": "Vencimiento próximo",
        "mensaje": "ABC SAC vence mañana.",
        "leida": false
    },
    {
        "id": 2,
        "tipo": "VENCIDO",
        "titulo": "Cliente vencido",
        "mensaje": "XYZ SAC está vencido.",
        "leida": false
    }
]
```

Entonces JavaScript muestra:

```javascript
async function cargarNotificaciones() {

    const respuesta =
        await fetch('/api/notificaciones');

    const notificaciones =
        await respuesta.json();

    const contenedor =
        document.getElementById('notificaciones');

    contenedor.innerHTML = '';

    notificaciones.forEach(n => {

        const elemento =
            document.createElement('div');

        elemento.classList.add('notificacion');

        elemento.innerHTML = `
            <strong>${n.titulo}</strong>
            <p>${n.mensaje}</p>
        `;

        contenedor.appendChild(elemento);
    });
}
```

Y puedes actualizar cada cierto tiempo:

```javascript
setInterval(
    cargarNotificaciones,
    60000
);
```

Eso consulta cada:

```text
60 segundos
```

---

# 13. Pero hay una mejora que recomiendo

Para tu sistema completo, yo separaría claramente estas responsabilidades:

```text
                 SPRING BOOT
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
   PRORRATEO     VENCIMIENTOS    VENTAS
       │             │             │
       ▼             ▼             ▼
    SERVICIO     NOTIFICACION   HISTORIAL
       │             │             │
       └─────────────┼─────────────┘
                     ▼
                  MYSQL
                     ▲
                     │
                REST API
                     │
                     ▼
                JAVASCRIPT
                     │
                     ▼
                 DASHBOARD
```

### Java

Se encarga de:

* calcular prorrateo;
* registrar ventas;
* registrar renovaciones;
* registrar cambios de plan;
* determinar fechas de servicio;
* detectar vencimientos;
* cambiar a `VENCIDO`;
* generar notificaciones;
* mantener el historial.

### JavaScript

Se encarga de:

* mostrar el prorrateo antes de confirmar;
* mostrar alertas;
* mostrar clientes;
* mostrar estados;
* mostrar botones;
* enviar las acciones al backend.

### MySQL

Se encarga de:

* conservar la información;
* relaciones;
* restricciones;
* historial;
* pagos;
* ventas.

**Y algo muy importante:** cuando hagamos la implementación de **renovación y cambio de plan a mitad de mes**, podemos reutilizar exactamente el mismo `ProrrateoService`. Así no tendrás una fórmula diferente para cada caso y evitamos que aparezcan inconsistencias entre una alta, una renovación y un cambio de plan.
