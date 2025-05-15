# WBEC Client Library

A TypeScript client library for interacting with WBEC (Wallbox Ecosystem Controller) devices. This library provides a robust interface to communicate with WBEC controllers, handling request queuing and various API endpoints.

## Installation
```
bash npm install @jb-io/wbec-client
``` 

## Features

- Complete TypeScript support with type definitions
- Request queue management to prevent device overload
- Comprehensive error handling
- Support for all WBEC API endpoints
- Automatic response parsing

## Quick Start
```
typescript import { WbecClient } from '@jb-io/wbec-client';
// Create a client instance const client = new WbecClient('192.168.1.100', { timeout: 5000, // Request timeout in ms maxRequestInterval: 1000 // Minimum time between requests });
// Get device configuration const config = await client.requestConfig();
// Get device status for box 1 const status = await client.requestStatus(1);
// Set PV mode and power await client.setPvValue({ pvMode: PvMode.Pv, pvWatt: 1000 });
``` 

## API Reference

### Constructor
```
typescript constructor(host: string, options: WbecDeviceOptions)
``` 

- `host`: IP address or hostname of the WBEC device
- `options`:
  - `timeout`: Request timeout in milliseconds (default: 5000)
  - `maxRequestInterval`: Minimum time between requests in milliseconds (default: 1000)

### Methods

#### Configuration and Status

- `requestConfig()`: Get device configuration
- `requestJson(id?: BoxId)`: Get JSON status for all or specific box
- `requestStatus(id: BoxId)`: Get detailed status for specific box
- `requestChargeLog(id: BoxId, length?: number)`: Get charging history

#### PV Control

- `requestPv()`: Get current PV settings
- `setPvValue(parameters: PvParameters)`: Update PV settings

#### Power Management

- `setCurrentLimit(id: BoxId, currentLimit: number)`: Set charging current limit
- `reset()`: Reset the device

### Types

The library includes comprehensive TypeScript definitions for all API responses and parameters. Key types include:

- `BoxId`: Valid box IDs (0-15)
- `PvMode`: PV operation modes
- `WbecConfigResponse`: Device configuration
- `WbecStatusResponse`: Box status
- `WbecPvResponse`: PV settings and status

## Rate Limiting

The library automatically manages request rates to prevent device overload. Requests are queued and processed according to the `maxRequestInterval` setting.

## Manufacturer Information

The WBEC Controller is developed by Stefan Ferstl ([steff393](https://github.com/steff393/wbec)). Many thanks for providing this excellent controller and for the support!

For more information and technical details, please visit the [Manufacturer's website](https://steff393.github.io/wbec-site/).

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### 0.0.3 (2025-05-15)
Features:
* Enhanced request queue management with request deduplication

### 0.0.2 (2025-05-13)
Refactor:
* Export typescript types from index
* Extract RateLimitedTaskQueue as separate class

### 0.0.1 (2025-05-08)
Features:
* Initial Release of library
