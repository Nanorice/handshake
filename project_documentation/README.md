# Handshake Project Documentation

## Overview
This directory contains the consolidated documentation for the Handshake project. All development efforts should reference these documents as the source of truth for product requirements, technical specifications, and implementation guidelines.

## Core Documentation Files

### Product Definition
- [**Product Requirements**](./handshake-product-requirements.md) - High-level product requirements, user personas, and core functionality
- [**UI/UX Design Specifications**](./handshake-software-specifications.md) - Detailed UI component descriptions and user experience guidelines

### Technical Documentation
- [**Software Architecture**](./handshake-ux-design.md) - Technical architecture, data flow, and system design
- [**API Routes**](./API_ROUTES.md) - Standardized API routes and response format specifications
- [**Database Schema**](./DATABASE_SCHEMA.md) - MongoDB schema definitions and implementation guidelines

## Implementation Guidelines

When working on the Handshake project, please follow these principles:

1. **Consistency First**: All implementations should strictly adhere to the patterns defined in these documents
2. **Document Updates**: If changes are required to the specifications, update these documents first
3. **Reference Hierarchy**: In case of conflicts between documents, the following precedence applies:
   - Product Requirements (highest)
   - Software Architecture
   - API Routes/Database Schema
   - UI/UX Design Specifications

## Project Structure

All development should follow the folder structure defined in the root `folder-structure.md` file, with implementation following the conventions in `project-rules.md`.

## Design System

Frontend implementation should adhere to the design system defined in the root `design-system.md` file, which includes color schemes, typography, and component styles. 