-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 28, 2025 at 08:48 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dataentry`
--

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `middleName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) NOT NULL,
  `employeeNo` varchar(50) NOT NULL,
  `status` enum('Active','Regular','Probation','Inactive','Resigned','Terminate','Awol') DEFAULT 'Active',
  `position` varchar(100) NOT NULL,
  `dateHire` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `footSize` varchar(20) DEFAULT NULL,
  `weight` varchar(20) DEFAULT NULL,
  `height` varchar(20) DEFAULT NULL,
  `personalContact` varchar(50) NOT NULL,
  `personalEmail` varchar(100) NOT NULL,
  `corporateEmail` varchar(100) NOT NULL,
  `birthday` date NOT NULL,
  `address` text NOT NULL,
  `startingRate` decimal(10,2) NOT NULL,
  `currentMonthlyRate` decimal(10,2) NOT NULL,
  `currentDailyRate` decimal(10,2) NOT NULL,
  `bdoAccount` varchar(50) DEFAULT NULL,
  `sssNumber` varchar(50) DEFAULT NULL,
  `pagIbigNumber` varchar(50) DEFAULT NULL,
  `philhealthNumber` varchar(50) DEFAULT NULL,
  `tinNumber` varchar(50) DEFAULT NULL,
  `joiningContractUrl` text DEFAULT NULL,
  `probationContractUrl` text DEFAULT NULL,
  `regularContractUrl` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `firstName`, `middleName`, `lastName`, `employeeNo`, `status`, `position`, `dateHire`, `endDate`, `footSize`, `weight`, `height`, `personalContact`, `personalEmail`, `corporateEmail`, `birthday`, `address`, `startingRate`, `currentMonthlyRate`, `currentDailyRate`, `bdoAccount`, `sssNumber`, `pagIbigNumber`, `philhealthNumber`, `tinNumber`, `joiningContractUrl`, `probationContractUrl`, `regularContractUrl`, `createdAt`, `updatedAt`) VALUES
(1, 'Jade Ryan', 'Leba', 'Blancaflor', '101', 'Regular', 'Human Resources', '2025-03-27', '2025-04-01', '11', '100', '5\'7', '0938 043 8403', 'bryanblancaflor007@gmail.com', 'blancaflor480@gmail.com', '2002-08-17', 'Kaingin, Tramo Street, Bacoor', 10000.00, 10000.00, 750.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=19HSUxam8A4pH-UwaPYmp5gIjHiw7cij1', 'https://drive.google.com/uc?export=view&id=1-tf9AFQVte7sNp6iQNLyS1DB1VKrCkUU', 'https://drive.google.com/uc?export=view&id=1io1TmNptPWNHoWm0ZZ_Edu07nTzY-Eso', '2025-03-27 03:12:08', '2025-03-27 03:12:08'),
(2, 'Juan', 'Del', 'Del Cruz', '102', 'Regular', 'Managing Director', '2025-03-28', '2025-03-31', '10', '70', '6\'0', '0938 043 8404', 'blancaflor480@gmail.com', 'bryanblancaflor007@gmail.com', '2002-08-17', 'Brgy. Digman, Joseph St. blk, Bacoor City, Cavite', 8000.00, 18000.00, 560.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1v3RDrFl21jpg_d4CLXtsc1FzHCGNaaqo', 'https://drive.google.com/uc?export=view&id=14PtRDRn2KeiLJ_Eh6BOGWfnopgHz7z5K', 'https://drive.google.com/uc?export=view&id=1jmchphbaggDxGtMntq0Wjlj_r4bJaRvl', '2025-03-28 02:11:21', '2025-03-28 02:11:21');

-- --------------------------------------------------------

--
-- Table structure for table `employee_leave`
--

CREATE TABLE `employee_leave` (
  `leave_id` int(11) NOT NULL,
  `employee_no` varchar(20) NOT NULL,
  `date_applied` date NOT NULL,
  `leave_type` enum('Vacation','Sick','Emergency','Maternity','Paternity','Bereavement','Other') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `leave_form` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `approved_by` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_leave`
--

INSERT INTO `employee_leave` (`leave_id`, `employee_no`, `date_applied`, `leave_type`, `start_date`, `end_date`, `reason`, `leave_form`, `status`, `approved_by`, `remarks`, `createdAt`, `updatedAt`) VALUES
(1, '102', '2025-03-28', 'Sick', '2025-03-28', '2025-03-29', 'aaaaa', 'https://drive.google.com/uc?export=view&id=1HZz7b4YtE5BeqTEtTuKfxVJhnpY4jW6q', 'Pending', NULL, NULL, '2025-03-28 07:11:26', '2025-03-28 07:11:26'),
(2, '102', '2025-03-28', 'Maternity', '2025-03-28', '2025-03-29', 'aaaaa', 'https://drive.google.com/uc?export=view&id=1ybM3usS5ABS9_6G1u7xCPlYB_SArk7AO', 'Pending', NULL, NULL, '2025-03-28 07:22:55', '2025-03-28 07:22:55');

-- --------------------------------------------------------

--
-- Table structure for table `employee_records`
--

CREATE TABLE `employee_records` (
  `recordID` int(11) NOT NULL,
  `employeeNo` varchar(50) DEFAULT NULL,
  `type` enum('NTE','IR','Leave') NOT NULL,
  `dateIssued` date NOT NULL,
  `details` text NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Resolved','Active') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_records`
--

INSERT INTO `employee_records` (`recordID`, `employeeNo`, `type`, `dateIssued`, `details`, `attachment`, `status`) VALUES
(1, '101', 'IR', '2025-03-28', 'HAHHAHAHA', 'https://drive.google.com/uc?export=view&id=1yOAxY04CWqJF6t9U1wRYdfnV8APznAmf', 'Pending');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employeeNo` (`employeeNo`);

--
-- Indexes for table `employee_leave`
--
ALTER TABLE `employee_leave`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `idx_employee_leave_employee` (`employee_no`),
  ADD KEY `idx_employee_leave_status` (`status`),
  ADD KEY `idx_employee_leave_dates` (`start_date`,`end_date`);

--
-- Indexes for table `employee_records`
--
ALTER TABLE `employee_records`
  ADD PRIMARY KEY (`recordID`),
  ADD KEY `employeeNo` (`employeeNo`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_leave`
--
ALTER TABLE `employee_leave`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_records`
--
ALTER TABLE `employee_records`
  MODIFY `recordID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `employee_leave`
--
ALTER TABLE `employee_leave`
  ADD CONSTRAINT `employee_leave_ibfk_1` FOREIGN KEY (`employee_no`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE;

--
-- Constraints for table `employee_records`
--
ALTER TABLE `employee_records`
  ADD CONSTRAINT `employee_records_ibfk_1` FOREIGN KEY (`employeeNo`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
