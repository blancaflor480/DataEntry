-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 10, 2025 at 02:54 AM
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
-- Table structure for table `edit_approvals`
--

CREATE TABLE `edit_approvals` (
  `id` int(11) NOT NULL,
  `employeeId` int(11) NOT NULL,
  `employeeName` varchar(255) NOT NULL,
  `employeeNo` varchar(50) NOT NULL,
  `field` varchar(50) NOT NULL,
  `oldValue` text DEFAULT NULL,
  `newValue` text NOT NULL,
  `requestedBy` varchar(255) NOT NULL,
  `requestedByEmail` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `requestedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `approvedBy` varchar(255) DEFAULT NULL,
  `approvedByEmail` varchar(255) DEFAULT NULL,
  `approvedAt` timestamp NULL DEFAULT NULL,
  `rejectedBy` varchar(255) DEFAULT NULL,
  `rejectedByEmail` varchar(255) DEFAULT NULL,
  `rejectedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `edit_approvals`
--

INSERT INTO `edit_approvals` (`id`, `employeeId`, `employeeName`, `employeeNo`, `field`, `oldValue`, `newValue`, `requestedBy`, `requestedByEmail`, `status`, `requestedAt`, `approvedBy`, `approvedByEmail`, `approvedAt`, `rejectedBy`, `rejectedByEmail`, `rejectedAt`) VALUES
(1, 1, 'Jade Ryan  Blancaflor', '2021-0090', 'employmentType', 'Trainee/Intern', 'On Probationary', 'xgTUyrf8yFdIlXUoXS9sPdoKW9O2', 'blancaflor480@gmail.com', 'pending', '2025-04-08 07:54:12', NULL, NULL, NULL, NULL, NULL, NULL);

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
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `employmentType` enum('On Probationary','Regular','Contractual','Project Based','Part-Time','Trainee/Intern','Resigned','AWOL','Terminated','Retired','End of Contract','Laid Off','Dismissed') NOT NULL,
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

INSERT INTO `employees` (`id`, `firstName`, `middleName`, `lastName`, `employeeNo`, `status`, `employmentType`, `position`, `dateHire`, `endDate`, `footSize`, `weight`, `height`, `personalContact`, `personalEmail`, `corporateEmail`, `birthday`, `address`, `startingRate`, `currentMonthlyRate`, `currentDailyRate`, `hoursRate`, `bdoAccount`, `sssNumber`, `pagIbigNumber`, `philhealthNumber`, `tinNumber`, `joiningContractUrl`, `probationContractUrl`, `regularContractUrl`, `createdAt`, `updatedAt`, `profileImageUrl`) VALUES
(1, 'Jade Ryan ', 'Leba', 'Blancaflor', '2021-0001', 'Active', 'Trainee/Intern', 'IT Specialist', '2025-03-17', '2025-06-17', '9', '55', '5\'7', '0938 043 8403', 'blancaflor480@gmail.com', 'matlexsystem2k25@gmail.com', '2002-08-17', 'Brgy. Kaingin, Tramo Street, Bacoor City, Cavite', 100.00, 3500.00, 100.00, 20.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1U-Y8xln2pGPKF4i9VLBYf5rsGtiZq6c0', 'https://drive.google.com/uc?export=view&id=1XmWIHoIg4fqpM1BmBipn93lw8qG-Uhc0', 'https://drive.google.com/uc?export=view&id=1EWcAXypmHoAZzNwimA491Iz-eiBhroDt', '2025-04-08 08:11:26', '2025-04-08 08:11:26', 'https://drive.google.com/uc?export=view&id=1_KKz_AbOydP8In3D1W4AyUh1bR2on__1');

-- --------------------------------------------------------

--
-- Table structure for table `employee_leave`
--

CREATE TABLE `employee_leave` (
  `leave_id` int(11) NOT NULL,
  `employee_no` varchar(20) NOT NULL,
  `date_applied` date NOT NULL,
  `leave_type` enum('Vacation Leave (VL)','Sick Leave (SL)','Emergency Leave (EL)','Maternity Leave','Parental Leave','Bereavement Leave','Birthday Leave','Other') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `leave_form` varchar(255) DEFAULT NULL,
  `status` enum('Pending for Approval','Approved','Rejected') DEFAULT 'Pending for Approval',
  `approved_by` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_leave`
--

INSERT INTO `employee_leave` (`leave_id`, `employee_no`, `date_applied`, `leave_type`, `start_date`, `end_date`, `reason`, `leave_form`, `status`, `approved_by`, `remarks`, `createdAt`, `updatedAt`, `processed_at`) VALUES
(1, '2021-0001', '2025-04-10', 'Sick Leave (SL)', '2025-04-11', '2025-04-15', '', 'https://drive.google.com/uc?export=view&id=1wClwEf-H9McDsLrmI48Aa6kdtX7PDbmK', 'Pending for Approval', NULL, NULL, '2025-04-10 00:49:41', '2025-04-10 00:49:41', NULL),
(2, '2021-0001', '2025-04-10', 'Vacation Leave (VL)', '2025-04-12', '2025-04-25', '', 'https://drive.google.com/uc?export=view&id=1BcasM4oNaIN8H-2WjCPTDQaEi4cuP8Ry', 'Pending for Approval', NULL, NULL, '2025-04-10 00:50:14', '2025-04-10 00:50:14', NULL);

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

-- --------------------------------------------------------

--
-- Table structure for table `incident_reports`
--

CREATE TABLE `incident_reports` (
  `incident_id` int(11) NOT NULL,
  `reported_by` varchar(100) NOT NULL,
  `employee_no` varchar(50) NOT NULL,
  `department_head` varchar(250) NOT NULL,
  `incident_category` enum('Employee Behavior','Misconduct & Violation','Workplace Accident','Policy Violation','Other') NOT NULL,
  `incident_type` enum('Absent','Late','Undertime','No call, No show','Frequent Absenteeism','Negligence','Insubordination','Dishonesty','Harassment','Theft','Substance Abuse','Violence/Aggression','Breach of Confidentiality','Other') NOT NULL,
  `incident_date` date NOT NULL,
  `incident_time` time DEFAULT NULL,
  `report_date` datetime DEFAULT current_timestamp(),
  `department` varchar(255) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `description` text NOT NULL,
  `resolution_details` varchar(255) NOT NULL,
  `witnesses` text DEFAULT NULL,
  `attachment1_path` varchar(255) DEFAULT NULL,
  `attachment1_name` varchar(255) DEFAULT NULL,
  `attachment2_path` varchar(255) DEFAULT NULL,
  `attachment2_name` varchar(255) DEFAULT NULL,
  `attachment3_path` varchar(255) DEFAULT NULL,
  `attachment3_name` varchar(255) DEFAULT NULL,
  `status` enum('Open','Under Investigation','Resolved','Closed','Reopened') DEFAULT 'Open',
  `severity` enum('Low','Medium','High','Critical') DEFAULT NULL,
  `reviewed_by` varchar(100) DEFAULT NULL,
  `review_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `incident_reports`
--

INSERT INTO `incident_reports` (`incident_id`, `reported_by`, `employee_no`, `department_head`, `incident_category`, `incident_type`, `incident_date`, `incident_time`, `report_date`, `department`, `location`, `description`, `resolution_details`, `witnesses`, `attachment1_path`, `attachment1_name`, `attachment2_path`, `attachment2_name`, `attachment3_path`, `attachment3_name`, `status`, `severity`, `reviewed_by`, `review_date`, `created_at`, `updated_at`) VALUES
(1, '2021-0001', '2021-0001', '2021-0001', 'Misconduct & Violation', 'Dishonesty', '2025-04-09', '05:47:00', '2025-04-10 05:48:09', 'Sales Department', 'Matlex', 'aaa', '', 'aa', 'https://drive.google.com/uc?export=view&id=1ZnkTCKzsmc3LXaPeDF8J-R5ext5Yx1km', 'IR_Blancaflor_2021-0001_20250409T214806.pdf', NULL, NULL, NULL, NULL, 'Open', 'Medium', NULL, NULL, '2025-04-09 21:48:09', '2025-04-09 21:48:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `edit_approvals`
--
ALTER TABLE `edit_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employeeId` (`employeeId`),
  ADD KEY `employeeNo` (`employeeNo`);

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
  ADD KEY `idx_employee_leave_dates` (`start_date`,`end_date`),
  ADD KEY `employee_approved_by_fk` (`approved_by`);

--
-- Indexes for table `employee_records`
--
ALTER TABLE `employee_records`
  ADD PRIMARY KEY (`recordID`),
  ADD KEY `employeeNo` (`employeeNo`);

--
-- Indexes for table `incident_reports`
--
ALTER TABLE `incident_reports`
  ADD PRIMARY KEY (`incident_id`),
  ADD KEY `fk_employee_no` (`employee_no`),
  ADD KEY `fk_employee_head` (`reported_by`),
  ADD KEY `fk_department_head` (`department_head`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `edit_approvals`
--
ALTER TABLE `edit_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employee_leave`
--
ALTER TABLE `employee_leave`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_records`
--
ALTER TABLE `employee_records`
  MODIFY `recordID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `incident_reports`
--
ALTER TABLE `incident_reports`
  MODIFY `incident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `edit_approvals`
--
ALTER TABLE `edit_approvals`
  ADD CONSTRAINT `edit_approvals_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `edit_approvals_ibfk_2` FOREIGN KEY (`employeeNo`) REFERENCES `employees` (`employeeNo`);

--
-- Constraints for table `employee_leave`
--
ALTER TABLE `employee_leave`
  ADD CONSTRAINT `employee_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_leave_ibfk_1` FOREIGN KEY (`employee_no`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE;

--
-- Constraints for table `employee_records`
--
ALTER TABLE `employee_records`
  ADD CONSTRAINT `employee_records_ibfk_1` FOREIGN KEY (`employeeNo`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE;

--
-- Constraints for table `incident_reports`
--
ALTER TABLE `incident_reports`
  ADD CONSTRAINT `fk_department_head` FOREIGN KEY (`department_head`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_head` FOREIGN KEY (`reported_by`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_no` FOREIGN KEY (`employee_no`) REFERENCES `employees` (`employeeNo`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
