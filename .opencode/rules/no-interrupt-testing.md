# No Interrumpir Flujo de Testing

## Regla

**NUNCA** reiniciar servicios (frontend/backend) sin preguntar primero al usuario cuando:
- Se está ejecutando tests
- Se está en medio de una tarea de testing
- El usuario ya dijo que los servicios están corriendo

## Cuándo Preguntar

Si se necesita reiniciar un servicio, preguntar:
> "Necesito reiniciar el [frontend/backend] para aplicar cambios en [archivo]. ¿Está bien o preferís hacerlo manualmente?"

## Alternativas

En lugar de reiniciar:
1. **Verificar si el cambio es crítico** - Si no lo es, continuar sin reiniciar
2. **Usar hot-reload** - Muchos cambios se aplican automáticamente
3. **Aplicar cambios al final** - Hacer todos los cambios de código primero, reiniciar al final
4. **Usar subagente** - Delegar reinicio a otro agente si es necesario

## Excepciones

Solo reiniciar sin preguntar si:
- El servicio está claramente caído (no responde en el puerto)
- Hay un error fatal que impide continuar
- El usuario explícitamente dio permiso antes

## Comando para Verificar Servicios

```bash
# Verificar si backend responde
curl -s http://localhost:4300/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"phone":"+59170000002","password":"Doctor123!"}' | head -1

# Verificar si frontend responde
curl -s http://localhost:3003/es/login | head -1
```
