-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 11, 2025 at 10:17 AM
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
(1, 1, 'Jade Ryan  Blancaflor', '2021-0090', 'employmentType', 'Trainee/Intern', 'On Probationary', 'xgTUyrf8yFdIlXUoXS9sPdoKW9O2', 'blancaflor480@gmail.com', 'pending', '2025-04-08 07:54:12', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 2, 'Juan Cruz', '2021-0002', 'employmentType', 'Regular', 'Contractual', 'xgTUyrf8yFdIlXUoXS9sPdoKW9O2', 'blancaflor480@gmail.com', 'approved', '2025-04-10 08:36:58', 'gTregEIJSpaxmVFboKW6b3c4WBh1', 'bryanblancaflor007@gmail.com', '2025-04-10 08:39:38', NULL, NULL, NULL);

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
(1, 'Jade Ryan ', 'Leba', 'Blancaflor', '2021-0001', 'Active', 'Trainee/Intern', 'IT Specialist', '2025-03-17', '2025-06-17', '9', '55', '5\'7', '0938 043 8403', 'blancaflor480@gmail.com', 'matlexsystem2k25@gmail.com', '2002-08-17', 'Brgy. Kaingin, Tramo Street, Bacoor City, Cavite', 100.00, 3500.00, 100.00, 20.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1U-Y8xln2pGPKF4i9VLBYf5rsGtiZq6c0', 'https://drive.google.com/uc?export=view&id=1XmWIHoIg4fqpM1BmBipn93lw8qG-Uhc0', 'https://drive.google.com/uc?export=view&id=1EWcAXypmHoAZzNwimA491Iz-eiBhroDt', '2025-04-08 08:11:26', '2025-04-08 08:11:26', 'https://drive.google.com/uc?export=view&id=1_KKz_AbOydP8In3D1W4AyUh1bR2on__1'),
(2, 'Juan', 'Dela', 'Cruz', '2021-0002', 'Active', 'Contractual', 'Sales Director', '2025-04-03', '2025-04-25', '11', '70', '6\'0', '0938 043 8404', 'bryanblancaflor007@gmail.com', 'sample@gmail.com', '2002-08-17', 'Brgy. Digman, Joseph St. blk, Bacoor City, Cavite', 8000.00, 18000.00, 560.00, 110.00, '1111-1111-1111', '11-1111111-1', '1111-1111-1111', '11-111111111-1', '111-111-111-111', 'https://drive.google.com/uc?export=view&id=1Ee6c_N6ban26HrG86IiIJPLfyw0lQ20i', 'https://drive.google.com/uc?export=view&id=1XYSwQGZggnK6erWd59tQIMdcg8s2KVho', 'https://drive.google.com/uc?export=view&id=1l8GzdvuCEX_Y25pFYZCCk7aEZdmQ7YXS', '2025-04-10 02:35:19', '2025-04-10 08:39:38', 'https://drive.google.com/uc?export=view&id=1zfVAshsStJ6KnVstNljVLLPk02AWDZnc');

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
(4, '2021-0002', '2025-04-10', 'Emergency Leave (EL)', '2025-04-18', '2025-04-22', '', 'https://drive.google.com/uc?export=view&id=1jGhFdbNt0p2byZvF4of3COshw2In3U2N', 'Approved', '2021-0002', 'jjjjj', '2025-04-10 02:40:16', '2025-04-10 02:47:00', NULL),
(5, '2021-0002', '2025-04-10', 'Sick Leave (SL)', '2025-04-11', '2025-04-14', '', 'https://drive.google.com/uc?export=view&id=15taUDbTbZk0A65E31dEM0Vjdvj7itACz', 'Pending for Approval', NULL, NULL, '2025-04-10 07:25:25', '2025-04-10 07:25:25', NULL),
(6, '2021-0002', '2025-04-11', 'Bereavement Leave', '2025-04-12', '2025-04-15', '', 'https://drive.google.com/uc?export=view&id=1QyQnIt3i99h9boWVVOzVZlgKq7vqf5zY', 'Approved', '2021-0001', 'aaaa', '2025-04-11 01:21:56', '2025-04-11 03:37:31', NULL),
(7, '2021-0001', '2025-04-11', 'Emergency Leave (EL)', '2025-04-12', '2025-04-22', '', 'https://drive.google.com/uc?export=view&id=1ilRgWPjMCFzbYV995PjCwkcnpLNxBPvQ', 'Pending for Approval', NULL, NULL, '2025-04-11 01:31:11', '2025-04-11 01:31:11', NULL),
(8, '2021-0002', '2025-04-11', 'Maternity Leave', '2025-04-18', '2025-04-24', '', 'https://drive.google.com/uc?export=view&id=1l63SqlmpFQUtCeY4koh2tILu_sxoH2G0', 'Pending for Approval', NULL, NULL, '2025-04-11 01:53:51', '2025-04-11 01:53:51', NULL),
(9, '2021-0002', '2025-04-11', 'Sick Leave (SL)', '2025-04-12', '2025-04-19', '', 'https://drive.google.com/uc?export=view&id=1qnzum3grGe0VT6We6NGc7jHP1rNqE7Uy', 'Pending for Approval', NULL, NULL, '2025-04-11 03:33:46', '2025-04-11 03:33:46', NULL);

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
  `reported_by` varchar(50) NOT NULL,
  `employee_no` varchar(50) NOT NULL,
  `department_head` varchar(50) NOT NULL,
  `incident_category` enum('Employee Behavior','Misconduct & Violation') NOT NULL DEFAULT 'Employee Behavior',
  `incident_type` enum('Absent','Late','Undertime','No call, No show','Frequent Absenteeism','Negligence','Insubordination','Dishonesty','Harassment','Theft','Substance Abuse','Violence/Aggression','Breach of Confidentiality') NOT NULL,
  `incident_date` date NOT NULL,
  `incident_time` time NOT NULL,
  `department` varchar(50) NOT NULL,
  `location` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `witnesses` text DEFAULT NULL,
  `severity` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Low',
  `status` enum('Pending','Under Investigation','Resolved','Closed','Processed') NOT NULL DEFAULT 'Pending',
  `resolution_details` text DEFAULT NULL,
  `attachment1_path` varchar(255) DEFAULT NULL,
  `attachment1_name` varchar(255) DEFAULT NULL,
  `attachment2_path` varchar(255) DEFAULT NULL,
  `attachment2_name` varchar(255) DEFAULT NULL,
  `attachment3_path` varchar(255) DEFAULT NULL,
  `attachment3_name` varchar(255) DEFAULT NULL,
  `processed_by` varchar(50) DEFAULT NULL,
  `process_date` date DEFAULT NULL,
  `nte_status` enum('','For NTE','NTE Issued') DEFAULT '',
  `nte_date_issued` date DEFAULT NULL,
  `nte_attachment_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `incident_reports`
--

INSERT INTO `incident_reports` (`incident_id`, `reported_by`, `employee_no`, `department_head`, `incident_category`, `incident_type`, `incident_date`, `incident_time`, `department`, `location`, `description`, `witnesses`, `severity`, `status`, `resolution_details`, `attachment1_path`, `attachment1_name`, `attachment2_path`, `attachment2_name`, `attachment3_path`, `attachment3_name`, `processed_by`, `process_date`, `nte_status`, `nte_date_issued`, `nte_attachment_path`, `created_at`, `updated_at`) VALUES
(1, '2021-0002', '2021-0001', '2021-0002', 'Employee Behavior', 'Absent', '2025-04-10', '16:16:00', 'Sales Department', 'aaaa', 'aaa', 'aaa', 'Medium', 'Resolved', 'aaa', 'https://drive.google.com/uc?export=view&id=1lNRNOVIlVegpYsDWusvRVjrzlnLyJ0jR', 'IR_Blancaflor_2021-0001_20250411T081638.png', NULL, NULL, NULL, NULL, '2021-0002', '0000-00-00', 'NTE Issued', '2025-04-11', 'https://drive.google.com/uc?export=view&id=1R3BPu2BeQ51CHhfLhCD9_aUJECcm1lpt', '2025-04-11 08:16:41', '2025-04-11 08:17:21');

-- --------------------------------------------------------

--
-- Table structure for table `leave_delete_requests`
--

CREATE TABLE `leave_delete_requests` (
  `request_id` int(11) NOT NULL,
  `leave_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `requested_by` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `employee_no` varchar(50) NOT NULL,
  `leave_type` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_by` varchar(255) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_delete_requests`
--

INSERT INTO `leave_delete_requests` (`request_id`, `leave_id`, `reason`, `requested_by`, `status`, `employee_no`, `leave_type`, `start_date`, `end_date`, `requested_at`, `processed_by`, `processed_at`) VALUES
(3, 5, 'Hello', 'Admin-blancaflor480@gmail.com', 'pending', '2021-0002', 'Sick Leave (SL)', '2025-04-10', '2025-04-13', '2025-04-11 01:22:37', NULL, NULL);

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
  ADD KEY `reported_by` (`reported_by`),
  ADD KEY `department_head` (`department_head`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_incident_status` (`status`),
  ADD KEY `idx_incident_category` (`incident_category`),
  ADD KEY `idx_employee_no` (`employee_no`);

--
-- Indexes for table `leave_delete_requests`
--
ALTER TABLE `leave_delete_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `leave_id` (`leave_id`),
  ADD KEY `employee_no` (`employee_no`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `edit_approvals`
--
ALTER TABLE `edit_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_leave`
--
ALTER TABLE `employee_leave`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
-- AUTO_INCREMENT for table `leave_delete_requests`
--
ALTER TABLE `leave_delete_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `incident_reports`
--
ALTER TABLE `incident_reports`
  ADD CONSTRAINT `incident_reports_ibfk_1` FOREIGN KEY (`reported_by`) REFERENCES `employees` (`employeeNo`),
  ADD CONSTRAINT `incident_reports_ibfk_2` FOREIGN KEY (`employee_no`) REFERENCES `employees` (`employeeNo`),
  ADD CONSTRAINT `incident_reports_ibfk_3` FOREIGN KEY (`department_head`) REFERENCES `employees` (`employeeNo`),
  ADD CONSTRAINT `incident_reports_ibfk_4` FOREIGN KEY (`processed_by`) REFERENCES `employees` (`employeeNo`);

--
-- Constraints for table `leave_delete_requests`
--
ALTER TABLE `leave_delete_requests`
  ADD CONSTRAINT `leave_delete_requests_ibfk_1` FOREIGN KEY (`leave_id`) REFERENCES `employee_leave` (`leave_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_delete_requests_ibfk_2` FOREIGN KEY (`employee_no`) REFERENCES `employees` (`employeeNo`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
