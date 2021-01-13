-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 13-01-2021 a las 04:38:42
-- Versión del servidor: 10.4.16-MariaDB
-- Versión de PHP: 7.4.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `404`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `answer`
--

CREATE TABLE `answer` (
  `id` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `idQuestion` int(11) NOT NULL,
  `body` text NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `likes` int(11) NOT NULL DEFAULT 0,
  `dislikes` int(100) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medals`
--

CREATE TABLE `medals` (
  `idUser` int(100) NOT NULL,
  `idElement` int(100) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` varchar(100) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `question`
--

CREATE TABLE `question` (
  `id` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `body` text NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `likes` int(100) NOT NULL DEFAULT 0,
  `dislikes` int(100) NOT NULL DEFAULT 0,
  `views` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `idQuestion` int(11) NOT NULL,
  `tag` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `img` varchar(100) DEFAULT NULL,
  `signupdate` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `visit`
--

CREATE TABLE `visit` (
  `idUser` int(11) NOT NULL,
  `idQuestion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `voteanswer`
--

CREATE TABLE `voteanswer` (
  `idUser` int(11) NOT NULL,
  `idAnswer` int(11) NOT NULL,
  `type` tinyint(4) NOT NULL COMMENT '1 es positivo -1 negativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `votequestion`
--

CREATE TABLE `votequestion` (
  `idUser` int(11) NOT NULL,
  `idQuestion` int(11) NOT NULL,
  `type` tinyint(4) NOT NULL COMMENT '1 es voto positivo y -1 voto negativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `answer`
--
ALTER TABLE `answer`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `medals`
--
ALTER TABLE `medals`
  ADD PRIMARY KEY (`idUser`,`type`,`description`,`idElement`) USING BTREE;

--
-- Indices de la tabla `question`
--
ALTER TABLE `question`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `visit`
--
ALTER TABLE `visit`
  ADD PRIMARY KEY (`idUser`,`idQuestion`);

--
-- Indices de la tabla `voteanswer`
--
ALTER TABLE `voteanswer`
  ADD PRIMARY KEY (`idUser`,`idAnswer`);

--
-- Indices de la tabla `votequestion`
--
ALTER TABLE `votequestion`
  ADD PRIMARY KEY (`idUser`,`idQuestion`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `answer`
--
ALTER TABLE `answer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `question`
--
ALTER TABLE `question`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
