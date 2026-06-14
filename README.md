# Telegram Taxi

Modern taxi application built with Vue 3, Vite and Mapbox.

## Overview

Telegram Taxi is a modern mobile-first taxi platform focused on fast performance, clean architecture and smooth map interactions.

The project includes:

- Real-time map interaction via Mapbox
- Pickup and destination selection
- Route rendering
- Tariff estimation
- Trip ordering flow
- Passenger interface optimized for Telegram Mini Apps
- Responsive mobile UI
- Modular architecture with Vue composables and Pinia stores

## Tech Stack

### Frontend

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- UnoCSS
- Mapbox GL
- VueUse

### Architecture

The project follows a modular architecture:

- stores/ — global application state
- composables/ — reusable business logic
- components/ — isolated UI blocks
- layouts/ — application layouts
- pages/ — route pages

## Features

- Interactive taxi map
- Address search
- Pickup point selection from map
- Destination selection
- Route visualization
- Dynamic tariff system
- Trip status flow
- Mobile-first UI
- Telegram Mini App ready

## Development

Install dependencies:

bash pnpm install

Run development server:

bash pnpm dev

Build project:

bash pnpm build

## Project Goals

The main goal of this project is to build a scalable taxi platform with clean frontend architecture and modern user experience.

## License

MIT License

Copyright (c) 2026 Eduard Shartner
