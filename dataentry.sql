-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 08, 2025 at 09:45 AM
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
  ADD KEY `idx_employee_leave_dates` (`start_date`,`end_date`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_leave`
--
ALTER TABLE `employee_leave`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_records`
--
ALTER TABLE `employee_records`
  MODIFY `recordID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `incident_reports`
--
ALTER TABLE `incident_reports`
  MODIFY `incident_id` int(11) NOT NULL AUTO_INCREMENT;

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
