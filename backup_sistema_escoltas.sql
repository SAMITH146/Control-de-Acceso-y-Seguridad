-- =============================================================================
-- BASE DE DATOS: SISTEMA_ESCOLTAS — LA PERLA S.A.
-- Script de Despliegue Oficial 100% Probado y Compatible con MySQL 5.7, 8.0 y MariaDB
-- Fecha: 2026-08-22T15:32:46.788Z
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `sistema_escoltas` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sistema_escoltas`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Estructura de tabla: `roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_rol` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ej: ADMINISTRADOR_SISTEMAS, ESCOLTA_OPERADOR',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de roles de seguridad para RBAC';

-- Datos para: `roles`
INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`, `created_at`, `updated_at`) VALUES (1, 'ADMINISTRADOR_SISTEMAS', 'Acceso total al sistema, configuración y auditoría', '2026-08-20 15:41:25', '2026-08-20 18:45:56');
INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`, `created_at`, `updated_at`) VALUES (2, 'ESCOLTA_OPERADOR', 'Personal de seguridad en portería encargado de entradas y salidas', '2026-08-20 18:45:56', '2026-08-20 18:45:56');

-- --------------------------------------------------------
-- Estructura de tabla: `usuarios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_usuario` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_documento` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash de contraseña seguro (ej. bcrypt/argon2)',
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` int unsigned NOT NULL,
  `estado_activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo',
  `eliminado` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `requiere_cambio_password` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  KEY `fk_usuarios_roles` (`id_rol`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cuentas de usuario para autenticación de personal de seguridad y admin';

-- Datos para: `usuarios`
INSERT INTO `usuarios` (`id_usuario`, `username`, `nombre_completo`, `numero_documento`, `password_hash`, `email`, `id_rol`, `estado_activo`, `eliminado`, `created_at`, `updated_at`, `requiere_cambio_password`) VALUES (1, 'admin', 'Administrador Principal', '1097000001', '$2a$10$m5aVRdcyECf1exxbshYUMet03yjLOC7osbbl3XyA/.Yq8Zw/5Aeou', 'admin@laperla.com', 1, 1, 0, '2026-08-20 15:41:34', '2026-08-21 22:04:31', 0);
INSERT INTO `usuarios` (`id_usuario`, `username`, `nombre_completo`, `numero_documento`, `password_hash`, `email`, `id_rol`, `estado_activo`, `eliminado`, `created_at`, `updated_at`, `requiere_cambio_password`) VALUES (4, 'Adolfo', 'Adolfo Gómez Pérez', '1097000004', '$2a$10$6rbqmwF4nk.stmy1inD7A.dRbHWqCzbIPMiXa2wOs/bpjMx55HhK6', 'adolfog@mail.com', 2, 0, 1, '2026-08-20 18:46:00', '2026-08-21 22:23:47', 0);
INSERT INTO `usuarios` (`id_usuario`, `username`, `nombre_completo`, `numero_documento`, `password_hash`, `email`, `id_rol`, `estado_activo`, `eliminado`, `created_at`, `updated_at`, `requiere_cambio_password`) VALUES (5, 'Samith', 'Yimmer Samith Duarte Plata', '1097609002', '$2a$10$hBfZOppyCWCpAeDEH4ksku2p6pazxc5K7fhSP.nFyzgmGWMTtFVSa', 'yimmersamithduarteplata624@gmail.com', 2, 1, 0, '2026-08-21 16:01:31', '2026-08-22 14:34:48', 0);
INSERT INTO `usuarios` (`id_usuario`, `username`, `nombre_completo`, `numero_documento`, `password_hash`, `email`, `id_rol`, `estado_activo`, `eliminado`, `created_at`, `updated_at`, `requiere_cambio_password`) VALUES (6, 'Carlos', 'Carlos Alberto Martínez', '1097000006', '$2a$10$HnmFcn7ALTxZibjRLUzms.sYCNeNQZ3cdM2dFlG/HK0kTWgNcJjDK', 'prueba@gmail.com', 2, 1, 0, '2026-08-21 21:35:16', '2026-08-21 22:04:31', 0);

-- --------------------------------------------------------
-- Estructura de tabla: `areas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `areas`;
CREATE TABLE `areas` (
  `id_area` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_area` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Sistemas',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_area`),
  UNIQUE KEY `nombre_area` (`nombre_area`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Departamentos y áreas físicas de La Perla S.A.';

-- Datos para: `areas`
INSERT INTO `areas` (`id_area`, `nombre_area`, `descripcion`, `estado_activo`, `created_at`, `updated_at`) VALUES (1, 'SISTEMAS', 'Departamento de sistemas', 1, '2026-08-20 16:13:59', '2026-08-20 16:13:59');
INSERT INTO `areas` (`id_area`, `nombre_area`, `descripcion`, `estado_activo`, `created_at`, `updated_at`) VALUES (2, 'CONTROL DE GESTION', NULL, 1, '2026-08-20 20:07:21', '2026-08-20 20:07:21');

-- --------------------------------------------------------
-- Estructura de tabla: `empleados`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `empleados`;
CREATE TABLE `empleados` (
  `id_empleado` int unsigned NOT NULL AUTO_INCREMENT,
  `tipo_documento` enum('CC','CE','PASAPORTE','PEP','PPT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CC',
  `numero_documento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_area` int unsigned NOT NULL,
  `email_corporativo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono_contacto` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  UNIQUE KEY `email_corporativo` (`email_corporativo`),
  KEY `fk_empleados_areas` (`id_area`),
  CONSTRAINT `fk_empleados_areas` FOREIGN KEY (`id_area`) REFERENCES `areas` (`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Personal interno de La Perla S.A. que recibe visitantes';

-- Datos para: `empleados`
INSERT INTO `empleados` (`id_empleado`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `cargo`, `id_area`, `email_corporativo`, `telefono_contacto`, `estado_activo`, `created_at`, `updated_at`) VALUES (1, 'CC', '1005106089', 'Oscar Giovanny', 'Garcia Rodrigez', 'Auxiliar Sistemas', 1, 'OSCAR.GARCIA@APUESTASLAPERLA.COM', '3134249132', 1, '2026-08-20 16:16:04', '2026-08-20 16:16:04');
INSERT INTO `empleados` (`id_empleado`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `cargo`, `id_area`, `email_corporativo`, `telefono_contacto`, `estado_activo`, `created_at`, `updated_at`) VALUES (2, 'CC', '223242442', 'SAUL', 'NARANJO', 'COORDINADOR', 2, 'REFGREGER@GMAI.COM', '32324343554', 1, '2026-08-20 20:08:16', '2026-08-20 20:08:16');

-- --------------------------------------------------------
-- Estructura de tabla: `visitantes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `visitantes`;
CREATE TABLE `visitantes` (
  `id_visitante` int unsigned NOT NULL AUTO_INCREMENT,
  `tipo_documento` enum('CC','CE','PASAPORTE','PEP','PPT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CC',
  `numero_documento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Documento único e indexado para búsqueda ágil en portería',
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresa_procedencia` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eps` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entidad Promotora de Salud (Obligatorio por SST)',
  `estado_activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: Activo, 0: Inactivo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_visitante`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  KEY `idx_visitantes_num_doc` (`numero_documento`),
  KEY `idx_visitantes_nombre_completo` (`nombre_completo`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Directorio maestro de personas externas que visitan la planta';

-- Datos para: `visitantes`
INSERT INTO `visitantes` (`id_visitante`, `tipo_documento`, `numero_documento`, `nombre_completo`, `telefono`, `empresa_procedencia`, `eps`, `estado_activo`, `created_at`, `updated_at`) VALUES (1, 'CC', '1097609002', 'Yimmer Samith Duarte Plata', '3125353157', NULL, 'Nueva EPS', 1, '2026-08-20 16:30:47', '2026-08-20 16:30:47');
INSERT INTO `visitantes` (`id_visitante`, `tipo_documento`, `numero_documento`, `nombre_completo`, `telefono`, `empresa_procedencia`, `eps`, `estado_activo`, `created_at`, `updated_at`) VALUES (2, 'CC', '911112222', 'VISITANTE', '5555555555555553', NULL, 'Nueva EPS', 1, '2026-08-20 20:09:58', '2026-08-20 20:09:58');
INSERT INTO `visitantes` (`id_visitante`, `tipo_documento`, `numero_documento`, `nombre_completo`, `telefono`, `empresa_procedencia`, `eps`, `estado_activo`, `created_at`, `updated_at`) VALUES (8, 'CC', '2345643673', 'Pedro Pablo Gutierrez', '3214263261', NULL, 'Sura', 1, '2026-08-21 15:36:33', '2026-08-21 15:36:33');
INSERT INTO `visitantes` (`id_visitante`, `tipo_documento`, `numero_documento`, `nombre_completo`, `telefono`, `empresa_procedencia`, `eps`, `estado_activo`, `created_at`, `updated_at`) VALUES (9, 'CC', '54536376272', 'Visistante2', '3235343323', NULL, 'Sanitas', 1, '2026-08-21 16:43:02', '2026-08-21 16:43:02');
INSERT INTO `visitantes` (`id_visitante`, `tipo_documento`, `numero_documento`, `nombre_completo`, `telefono`, `empresa_procedencia`, `eps`, `estado_activo`, `created_at`, `updated_at`) VALUES (10, 'CC', '10986754670', 'carlos andres duarte', '3232324454', NULL, 'Salud mia', 1, '2026-08-21 19:03:47', '2026-08-21 19:03:47');
INSERT INTO `visitantes` (`id_visitante`, `tipo_documento`, `numero_documento`, `nombre_completo`, `telefono`, `empresa_procedencia`, `eps`, `estado_activo`, `created_at`, `updated_at`) VALUES (11, 'CC', '9657483323', 'felipe', '232313234131', NULL, 'Salud mia', 1, '2026-08-21 22:26:20', '2026-08-21 22:26:20');

-- --------------------------------------------------------
-- Estructura de tabla: `bitacora_visitas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `bitacora_visitas`;
CREATE TABLE `bitacora_visitas` (
  `id_visita` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_visitante` int unsigned NOT NULL,
  `id_empleado_visita` int unsigned NOT NULL,
  `id_area_destino` int unsigned NOT NULL,
  `objetos_ingresados` text COLLATE utf8mb4_unicode_ci COMMENT 'Descripción de los objetos que ingresa el visitante',
  `fecha_hora_ingreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_hora_salida` datetime DEFAULT NULL,
  `estado_visita` enum('EN_PLANTA','FINALIZADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_PLANTA',
  `id_escolta_ingreso` int unsigned NOT NULL COMMENT 'Operador/Escolta que registra entrada',
  `id_escolta_salida` int unsigned DEFAULT NULL COMMENT 'Operador/Escolta que registra salida',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_visita`),
  KEY `fk_bitacora_escolta_ingreso` (`id_escolta_ingreso`),
  KEY `fk_bitacora_escolta_salida` (`id_escolta_salida`),
  KEY `idx_bitacora_ingreso` (`fecha_hora_ingreso`),
  KEY `idx_bitacora_estado` (`estado_visita`),
  KEY `idx_bitacora_visitante_fecha` (`id_visitante`,`fecha_hora_ingreso`),
  KEY `idx_bitacora_empleado` (`id_empleado_visita`),
  KEY `idx_bitacora_area` (`id_area_destino`),
  CONSTRAINT `fk_bitacora_area` FOREIGN KEY (`id_area_destino`) REFERENCES `areas` (`id_area`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bitacora_empleado` FOREIGN KEY (`id_empleado_visita`) REFERENCES `empleados` (`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bitacora_escolta_ingreso` FOREIGN KEY (`id_escolta_ingreso`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bitacora_escolta_salida` FOREIGN KEY (`id_escolta_salida`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bitacora_visitante` FOREIGN KEY (`id_visitante`) REFERENCES `visitantes` (`id_visitante`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bitácora central de entradas y salidas de la planta';

-- Datos para: `bitacora_visitas`
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (1, 1, 1, 1, 'rrrrrr', '2026-08-20 16:30:47', '2026-08-20 17:57:20', 'FINALIZADO', 1, 1, 'rrrrrrrrrr [Salida: Deja todo en orden]', '2026-08-20 16:30:47', '2026-08-20 17:57:20');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (2, 1, 1, 1, 'rrrr', '2026-08-20 18:37:55', '2026-08-20 18:47:44', 'FINALIZADO', 1, 4, 'rrrrrrrrrrrrrrr [Salida: tood en orden ]', '2026-08-20 18:37:55', '2026-08-20 18:47:44');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (3, 1, 1, 1, 'eeeeeeeeee', '2026-08-20 18:55:42', '2026-08-20 18:58:24', 'FINALIZADO', 4, 4, 'ttttttttte [Salida: rerr]', '2026-08-20 18:55:42', '2026-08-20 18:58:24');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (4, 2, 2, 2, 'PISTOLA', '2026-08-20 20:09:58', '2026-08-20 20:11:42', 'FINALIZADO', 4, 4, 'MATAR A NARANJO [Salida: RRRRR]', '2026-08-20 20:09:58', '2026-08-20 20:11:42');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (5, 1, 2, 2, 'rrrrrrrr', '2026-08-21 13:46:31', '2026-08-21 14:07:52', 'FINALIZADO', 4, 4, 'rrrrrrrr [Salida: Todo en orden ]', '2026-08-21 13:46:31', '2026-08-21 14:07:52');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (6, 8, 1, 1, 'Ingresa con bolso negro y pc ', '2026-08-21 15:36:33', '2026-08-21 15:43:48', 'FINALIZADO', 4, 4, 'activar vendedores en sistemas  [Salida: Sin novedad ]', '2026-08-21 15:36:33', '2026-08-21 15:43:48');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (7, 9, 1, 1, 'Ingresa bolso y cargador portátil', '2026-08-21 16:43:02', '2026-08-21 18:31:26', 'FINALIZADO', 4, 4, 'Entrega de equipo de computo  [Salida: todo en orden 
]', '2026-08-21 16:43:02', '2026-08-21 18:31:26');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (8, 9, 1, 1, 'qwsdwd', '2026-08-21 18:31:48', '2026-08-21 18:58:02', 'FINALIZADO', 4, 4, 'wdqdqWDQ [Salida: NO ENTREGO]', '2026-08-21 18:31:48', '2026-08-21 18:58:02');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (9, 10, 1, 1, 'Entra con bolso  negro', '2026-08-21 19:03:47', '2026-08-21 22:02:45', 'FINALIZADO', 4, 1, 'SIISTEMAS [Salida: Todo en orden]', '2026-08-21 19:03:47', '2026-08-21 22:02:45');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (10, 11, 2, 2, 'cosas', '2026-08-21 22:26:20', '2026-08-22 12:28:19', 'FINALIZADO', 5, 5, 'r [Salida: Todo en orden]', '2026-08-21 22:26:20', '2026-08-22 12:28:19');
INSERT INTO `bitacora_visitas` (`id_visita`, `id_visitante`, `id_empleado_visita`, `id_area_destino`, `objetos_ingresados`, `fecha_hora_ingreso`, `fecha_hora_salida`, `estado_visita`, `id_escolta_ingreso`, `id_escolta_salida`, `observaciones`, `created_at`, `updated_at`) VALUES (11, 1, 1, 1, 'trtrtrt', '2026-08-22 14:35:05', NULL, 'EN_PLANTA', 5, NULL, 'ererere', '2026-08-22 14:35:05', '2026-08-22 14:35:05');

-- --------------------------------------------------------
-- Estructura de tabla: `lista_negra`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `lista_negra`;
CREATE TABLE `lista_negra` (
  `id_lista_negra` int unsigned NOT NULL AUTO_INCREMENT,
  `id_visitante` int unsigned NOT NULL,
  `fecha_bloqueo` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `motivo_bloqueo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_usuario_registro` int unsigned NOT NULL COMMENT 'Usuario/Admin que aplicó el bloqueo',
  `estado_activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1: Bloqueo Vigente/Vetado, 0: Bloqueo Levantado',
  `fecha_desbloqueo` datetime DEFAULT NULL,
  `motivo_desbloqueo` text COLLATE utf8mb4_unicode_ci,
  `id_usuario_desbloqueo` int unsigned DEFAULT NULL COMMENT 'Usuario/Admin que autorizó el levantamiento',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_lista_negra`),
  KEY `fk_lista_negra_usuario_registro` (`id_usuario_registro`),
  KEY `fk_lista_negra_usuario_desbloqueo` (`id_usuario_desbloqueo`),
  KEY `idx_lista_negra_activo` (`id_visitante`,`estado_activo`),
  CONSTRAINT `fk_lista_negra_usuario_desbloqueo` FOREIGN KEY (`id_usuario_desbloqueo`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lista_negra_usuario_registro` FOREIGN KEY (`id_usuario_registro`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lista_negra_visitante` FOREIGN KEY (`id_visitante`) REFERENCES `visitantes` (`id_visitante`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro y auditoría de visitantes con acceso denegado o vetados';

-- Datos para: `lista_negra`
INSERT INTO `lista_negra` (`id_lista_negra`, `id_visitante`, `fecha_bloqueo`, `motivo_bloqueo`, `id_usuario_registro`, `estado_activo`, `fecha_desbloqueo`, `motivo_desbloqueo`, `id_usuario_desbloqueo`, `created_at`, `updated_at`) VALUES (4, 2, '2026-08-21 15:32:17', 'No se permite ingresar ', 1, 0, '2026-08-21 16:16:56', 'Solicitud Aprobada: Aprobado tras revisión de antecedentes.', 1, '2026-08-21 15:32:17', '2026-08-21 16:16:56');
INSERT INTO `lista_negra` (`id_lista_negra`, `id_visitante`, `fecha_bloqueo`, `motivo_bloqueo`, `id_usuario_registro`, `estado_activo`, `fecha_desbloqueo`, `motivo_desbloqueo`, `id_usuario_desbloqueo`, `created_at`, `updated_at`) VALUES (5, 2, '2026-08-21 16:20:35', 'Peticion de escoltas ', 1, 1, NULL, NULL, NULL, '2026-08-21 16:20:35', '2026-08-21 16:20:35');
INSERT INTO `lista_negra` (`id_lista_negra`, `id_visitante`, `fecha_bloqueo`, `motivo_bloqueo`, `id_usuario_registro`, `estado_activo`, `fecha_desbloqueo`, `motivo_desbloqueo`, `id_usuario_desbloqueo`, `created_at`, `updated_at`) VALUES (6, 8, '2026-08-21 16:39:39', '[REPORTE ESCOLTA: BLOQUEO AL USUARIO YA QUE AL PARCERO ROBO UN TECLADO] - Bloqueo aprobado tras reporte de seguridad.', 5, 1, NULL, NULL, NULL, '2026-08-21 16:39:39', '2026-08-21 16:39:39');
INSERT INTO `lista_negra` (`id_lista_negra`, `id_visitante`, `fecha_bloqueo`, `motivo_bloqueo`, `id_usuario_registro`, `estado_activo`, `fecha_desbloqueo`, `motivo_desbloqueo`, `id_usuario_desbloqueo`, `created_at`, `updated_at`) VALUES (7, 9, '2026-08-21 18:58:58', '[REPORTE ESCOLTA: Se solicita bloqueo] - Bloqueo aprobado tras reporte de seguridad.', 4, 0, '2026-08-21 19:00:15', 'Solicitud Aprobada: Aprobado tras revisión de antecedentes.', 1, '2026-08-21 18:58:58', '2026-08-21 19:00:15');

-- --------------------------------------------------------
-- Estructura de tabla: `solicitudes_bloqueo`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `solicitudes_bloqueo`;
CREATE TABLE `solicitudes_bloqueo` (
  `id_solicitud_bloqueo` int unsigned NOT NULL AUTO_INCREMENT,
  `id_visitante` int unsigned DEFAULT NULL,
  `numero_documento` varchar(30) NOT NULL,
  `nombre_visitante` varchar(150) NOT NULL,
  `id_usuario_solicita` int unsigned NOT NULL,
  `motivo_solicitud` text NOT NULL,
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE',
  `fecha_solicitud` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_responde` int unsigned DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT NULL,
  `respuesta_admin` text,
  PRIMARY KEY (`id_solicitud_bloqueo`),
  KEY `id_visitante` (`id_visitante`),
  KEY `id_usuario_solicita` (`id_usuario_solicita`),
  KEY `id_usuario_responde` (`id_usuario_responde`),
  CONSTRAINT `solicitudes_bloqueo_ibfk_1` FOREIGN KEY (`id_visitante`) REFERENCES `visitantes` (`id_visitante`) ON DELETE SET NULL,
  CONSTRAINT `solicitudes_bloqueo_ibfk_2` FOREIGN KEY (`id_usuario_solicita`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `solicitudes_bloqueo_ibfk_3` FOREIGN KEY (`id_usuario_responde`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para: `solicitudes_bloqueo`
INSERT INTO `solicitudes_bloqueo` (`id_solicitud_bloqueo`, `id_visitante`, `numero_documento`, `nombre_visitante`, `id_usuario_solicita`, `motivo_solicitud`, `estado`, `fecha_solicitud`, `id_usuario_responde`, `fecha_respuesta`, `respuesta_admin`) VALUES (1, NULL, '2345643673', 'Pedro Pablo Gutierrez', 5, 'BLOQUEO AL USUARIO YA QUE AL PARCERO ROBO UN TECLADO', 'APROBADO', '2026-08-21 16:32:49', 1, '2026-08-21 16:39:39', 'Bloqueo aprobado tras reporte de seguridad.');
INSERT INTO `solicitudes_bloqueo` (`id_solicitud_bloqueo`, `id_visitante`, `numero_documento`, `nombre_visitante`, `id_usuario_solicita`, `motivo_solicitud`, `estado`, `fecha_solicitud`, `id_usuario_responde`, `fecha_respuesta`, `respuesta_admin`) VALUES (2, 9, '54536376272', 'Visistante2', 4, 'Se solicita bloqueo', 'APROBADO', '2026-08-21 18:58:24', 1, '2026-08-21 18:58:58', 'Bloqueo aprobado tras reporte de seguridad.');

-- --------------------------------------------------------
-- Estructura de tabla: `solicitudes_desbloqueo`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `solicitudes_desbloqueo`;
CREATE TABLE `solicitudes_desbloqueo` (
  `id_solicitud` int unsigned NOT NULL AUTO_INCREMENT,
  `id_lista_negra` int unsigned NOT NULL,
  `id_visitante` int unsigned NOT NULL,
  `id_usuario_solicita` int unsigned NOT NULL,
  `motivo_solicitud` text NOT NULL,
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE',
  `fecha_solicitud` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_responde` int unsigned DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT NULL,
  `respuesta_admin` text,
  PRIMARY KEY (`id_solicitud`),
  KEY `id_lista_negra` (`id_lista_negra`),
  KEY `id_visitante` (`id_visitante`),
  KEY `id_usuario_solicita` (`id_usuario_solicita`),
  KEY `id_usuario_responde` (`id_usuario_responde`),
  CONSTRAINT `solicitudes_desbloqueo_ibfk_1` FOREIGN KEY (`id_lista_negra`) REFERENCES `lista_negra` (`id_lista_negra`) ON DELETE CASCADE,
  CONSTRAINT `solicitudes_desbloqueo_ibfk_2` FOREIGN KEY (`id_visitante`) REFERENCES `visitantes` (`id_visitante`) ON DELETE CASCADE,
  CONSTRAINT `solicitudes_desbloqueo_ibfk_3` FOREIGN KEY (`id_usuario_solicita`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `solicitudes_desbloqueo_ibfk_4` FOREIGN KEY (`id_usuario_responde`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para: `solicitudes_desbloqueo`
INSERT INTO `solicitudes_desbloqueo` (`id_solicitud`, `id_lista_negra`, `id_visitante`, `id_usuario_solicita`, `motivo_solicitud`, `estado`, `fecha_solicitud`, `id_usuario_responde`, `fecha_respuesta`, `respuesta_admin`) VALUES (1, 4, 2, 4, 'Ya se permite ingresar', 'APROBADO', '2026-08-21 16:16:19', 1, '2026-08-21 16:16:56', 'Aprobado tras revisión de antecedentes.');
INSERT INTO `solicitudes_desbloqueo` (`id_solicitud`, `id_lista_negra`, `id_visitante`, `id_usuario_solicita`, `motivo_solicitud`, `estado`, `fecha_solicitud`, `id_usuario_responde`, `fecha_respuesta`, `respuesta_admin`) VALUES (2, 7, 9, 4, 'Por favor desbloquear', 'APROBADO', '2026-08-21 18:59:43', 1, '2026-08-21 19:00:15', 'Aprobado tras revisión de antecedentes.');

-- --------------------------------------------------------
-- Estructura de vista: `v_verificacion_seguridad_visitante`
-- --------------------------------------------------------
DROP VIEW IF EXISTS `v_verificacion_seguridad_visitante`;
CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_verificacion_seguridad_visitante` AS select `v`.`id_visitante` AS `id_visitante`,`v`.`tipo_documento` AS `tipo_documento`,`v`.`numero_documento` AS `numero_documento`,`v`.`nombre_completo` AS `nombre_completo`,`v`.`eps` AS `eps`,(case when ((`ln`.`id_lista_negra` is not null) and (`ln`.`estado_activo` = 1)) then 'DENEGADO / VETADO' else 'AUTORIZADO' end) AS `estado_seguridad`,`ln`.`motivo_bloqueo` AS `motivo_bloqueo`,`ln`.`fecha_bloqueo` AS `fecha_bloqueo` from (`visitantes` `v` left join `lista_negra` `ln` on(((`v`.`id_visitante` = `ln`.`id_visitante`) and (`ln`.`estado_activo` = 1))));

-- --------------------------------------------------------
-- Estructura de vista: `v_visitantes_en_planta`
-- --------------------------------------------------------
DROP VIEW IF EXISTS `v_visitantes_en_planta`;
CREATE ALGORITHM=UNDEFINED  SQL SECURITY DEFINER VIEW `v_visitantes_en_planta` AS select `b`.`id_visita` AS `id_visita`,`v`.`tipo_documento` AS `tipo_documento`,`v`.`numero_documento` AS `numero_documento`,`v`.`nombre_completo` AS `visitante`,`v`.`eps` AS `eps`,`a`.`nombre_area` AS `area_destino`,concat(`e`.`nombres`,' ',`e`.`apellidos`) AS `empleado_anfitrion`,`b`.`objetos_ingresados` AS `objetos_ingresados`,`b`.`fecha_hora_ingreso` AS `fecha_hora_ingreso`,timestampdiff(MINUTE,`b`.`fecha_hora_ingreso`,now()) AS `minutos_en_planta`,`u_in`.`username` AS `escolta_ingreso`,`b`.`observaciones` AS `observaciones` from ((((`bitacora_visitas` `b` join `visitantes` `v` on((`b`.`id_visitante` = `v`.`id_visitante`))) join `empleados` `e` on((`b`.`id_empleado_visita` = `e`.`id_empleado`))) join `areas` `a` on((`b`.`id_area_destino` = `a`.`id_area`))) join `usuarios` `u_in` on((`b`.`id_escolta_ingreso` = `u_in`.`id_usuario`))) where (`b`.`estado_visita` = 'EN_PLANTA');

SET FOREIGN_KEY_CHECKS = 1;
