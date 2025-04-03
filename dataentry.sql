-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 03, 2025 at 08:41 AM
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
  `hoursRate` decimal(10,2) NOT NULL,
  `bdoAccount` varchar(50) DEFAULT NULL,
  `sssNumber` varchar(50) DEFAULT NULL,
  `pagIbigNumber` varchar(50) DEFAULT NULL,
  `philhealthNumber` varchar(50) DEFAULT NULL,
  `tinNumber` varchar(50) DEFAULT NULL,
  `joiningContractUrl` text DEFAULT NULL,
  `probationContractUrl` text DEFAULT NULL,
  `regularContractUrl` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profileImageUrl` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `firstName`, `middleName`, `lastName`, `employeeNo`, `status`, `position`, `dateHire`, `endDate`, `footSize`, `weight`, `height`, `personalContact`, `personalEmail`, `corporateEmail`, `birthday`, `address`, `startingRate`, `currentMonthlyRate`, `currentDailyRate`, `hoursRate`, `bdoAccount`, `sssNumber`, `pagIbigNumber`, `philhealthNumber`, `tinNumber`, `joiningContractUrl`, `probationContractUrl`, `regularContractUrl`, `createdAt`, `updatedAt`, `profileImageUrl`) VALUES
(1, 'admin', 'admin', 'admin', '111', 'Probation', 'Human Resources', '2025-04-03', '2025-04-30', '11', '70', '6\'0', '0938 043 8404', 'bryanblancaflor007@gmail.com', 'matlex@gmail.com', '2002-08-17', 'Brgy. Digman, Joseph St. blk, Bacoor City, Cavite', 8000.00, 18000.00, 560.00, 110.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1AtyOqq8RZWaB8irEGBQfIkoJvCP-fg5u', 'https://drive.google.com/uc?export=view&id=1Sq-zcMhDPHCnoX-UBZ67iFNjb4zIfIbP', 'https://drive.google.com/uc?export=view&id=1IZVm__TEob1VYEpSutAxwt1qiXoZVQ4U', '2025-04-03 03:54:51', '2025-04-03 03:54:51', 'https://drive.google.com/uc?export=view&id=1jbQAleRqTEH6CIWxAOsn3r9id9eEgqQW'),
(2, 'admin', 'admin', 'admin', '2021', 'Terminate', 'Human Resources', '2025-04-02', '2025-04-29', '11', '70', '6\'0', '0938 043 8404', 'bryanblancaflor007@gmail.com', 'matlex12222@gmail.com', '2002-08-16', 'Brgy. Digman, Joseph St. blk, Bacoor City, Cavite', 8000.00, 18000.00, 560.00, 110.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1SoCt91l2-YOpO22hWrDjYNV7EwD1gHAb', 'https://drive.google.com/uc?export=view&id=1ADZ09eOsAPI7xYvsDHlyx7giF_R3muOR', 'https://drive.google.com/uc?export=view&id=1fjVMQpKhVPZR3x6hun80bX4cGfjCU5WN', '2025-04-03 03:56:59', '2025-04-03 05:54:47', 'https://drive.google.com/uc?export=view&id=1M23VlLQOwUj6gDTsl_UY78c-Q27SzK67'),
(3, 'Jade ', 'Ryan', 'Blancaflor', '2021-001', 'Active', 'Human Resources', '2025-04-01', '2025-04-28', '11', '100', '5\'8', '0938 043 8404', 'jaderyan@gmail.com', 'jaderyan007@gmail.com', '2002-08-15', 'Brgy. Digman, Joseph St. blk, Bacoor City, Cavite', 8000.00, 18000.00, 560.00, 110.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1k1Hn-WLxWdPeoc7tqmjD5rlUt4l_UXvQ', 'https://drive.google.com/uc?export=view&id=1G4zvN8GlGEY1anDqFjimT8K9tBbkuLzS', 'https://drive.google.com/uc?export=view&id=1Y9ZW0PI9z_vYTp-eDXCTffqTGV7q92-u', '2025-04-03 03:59:11', '2025-04-03 05:23:28', 'https://drive.google.com/uc?export=view&id=1SAeKBvUL6D7eZbyiwnnA7gnSbiduGXSt'),
(4, 'jade', 'admin', 'Blancaflor', '2021-002', 'Inactive', 'Human Resources', '2025-04-03', '2025-04-30', '11', '70', '6\'0', '0938 043 8404', 'bryanblancaflor007@gmail.com', 'matlex12222@gmail.com', '2002-08-17', 'Brgy. Digman, Joseph St. blk, Bacoor City, Cavite', 8000.00, 18000.00, 560.00, 110.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1p-6ZSD1RX-4R7tkE64PwaAl7xORrHGce', 'https://drive.google.com/uc?export=view&id=1f-wWcRwkCidx83mTCaLwyYUW5QhNmUSe', 'https://drive.google.com/uc?export=view&id=1wcQQ7gU85MbUFriP52lk83MSlrg_a7Bn', '2025-04-03 06:10:15', '2025-04-03 06:10:15', 'https://drive.google.com/uc?export=view&id=1bwwbQ1qEbWbpe4So0flT2T8IjmjxVAor');

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
  `status` enum('Pending for Approval','Approved','Rejected') DEFAULT 'Pending for Approval',
  `approved_by` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_leave`
--

INSERT INTO `employee_leave` (`leave_id`, `employee_no`, `date_applied`, `leave_type`, `start_date`, `end_date`, `reason`, `leave_form`, `status`, `approved_by`, `remarks`, `createdAt`, `updatedAt`) VALUES
(3, '103', '2025-03-28', 'Bereavement', '2025-03-29', '2025-04-05', 'fasfafasfasfafaf', 'https://drive.google.com/uc?export=view&id=1ddszdlEe7RTgaVQCod1E6bvK3Bg7i5C0', 'Pending for Approval', NULL, NULL, '2025-03-28 08:28:32', '2025-04-02 01:32:42'),
(4, '2021-002', '2025-04-03', 'Vacation', '2025-04-03', '2025-04-11', 'sss', 'https://drive.google.com/uc?export=view&id=18BpWO13J15R9Tb8dSOyVI8qEOwiTj6on', '', NULL, NULL, '2025-04-03 06:28:00', '2025-04-03 06:28:00');

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
  `status` enum('Pending for Approval','Result','Approved') DEFAULT 'Pending for Approval'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_records`
--

INSERT INTO `employee_records` (`recordID`, `employeeNo`, `type`, `dateIssued`, `details`, `attachment`, `status`) VALUES
(1, '101', 'IR', '2025-03-24', 'HAHHAHAHA', 'https://drive.google.com/uc?export=view&id=1yOAxY04CWqJF6t9U1wRYdfnV8APznAmf', 'Pending for Approval'),
(3, '2021-002', 'IR', '2025-04-03', 'adasdasd', 'https://drive.google.com/uc?export=view&id=1yGF8rP30UDzV6wJato9oZwMawsB1rJi5', 'Pending for Approval');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employee_leave`
--
ALTER TABLE `employee_leave`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employee_records`
--
ALTER TABLE `employee_records`
  MODIFY `recordID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
