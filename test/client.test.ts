
import { WbecClient } from '../src/wbec-client';
import axios from 'axios';
import { PvMode, WbecJsonResponse, WbecPvResponse, WbecConfigResponse, WbecStatusResponse, WbecChargeLogResponse } from '../src/types';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('WbecClient', () => {
    let client: WbecClient;
    const TEST_HOST = '192.168.1.100';
    const TEST_OPTIONS = {
        timeout: 1000,
        maxRequestInterval: 50
    };

    // Mock-Daten
    const mockJsonResponse: WbecJsonResponse = {
        wbec: {
            version: '1.0.0',
            bldDate: '2024-01-01',
            timeNow: '12:00:00',
            enwg14a: 0,
            enwgErr: 0
        },
        box: [{
            busId: 1,
            version: '1.0',
            chgStat: 0,
            currL1: 0,
            currL2: 0,
            currL3: 0,
            pcbTemp: 25,
            voltL1: 230,
            voltL2: 230,
            voltL3: 230,
            extLock: 0,
            power: 0,
            energyP: 0,
            energyI: 0,
            energyC: 0,
            currMax: 16,
            currMin: 6,
            logStr: '',
            wdTmOut: 0,
            standby: 0,
            remLock: 0,
            currLim: 16,
            currFs: 6,
            lmReq: 0,
            lmLim: 0,
            resCode: '',
            failCnt: 0
        }],
        modbus: {
            state: {
                lastTm: 0,
                millis: 0
            }
        },
        rfid: {
            enabled: false,
            release: false,
            lastId: ''
        },
        pv: {
            mode: PvMode.Disabled,
            watt: 0,
            wbId: 0
        },
        wifi: {
            mac: '00:11:22:33:44:55',
            rssi: -70,
            signal: 60,
            channel: 1
        }
    };

    const mockPvResponse: WbecPvResponse = {
        box: {
            chgStat: 0,
            power: 1000,
            currLim: 16,
            resCode: ''
        },
        modbus: {
            millis: 0
        },
        pv: {
            mode: PvMode.Pv,
            watt: 1000,
            batt: 0
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        client = new WbecClient(TEST_HOST, TEST_OPTIONS);
    });

    describe('Request Queue Management', () => {
        it('should process multiple requests with correct timing', async () => {
            const startTime = Date.now();
            mockedAxios.get.mockResolvedValue({ data: mockJsonResponse });

            const requests = Array(3).fill(null).map(() => client.requestJson());
            await Promise.all(requests);

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            expect(totalTime).toBeGreaterThanOrEqual(TEST_OPTIONS.maxRequestInterval * 2);
            expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        });

        it('should maintain request order', async () => {
            const responses = [
                { data: { id: 1 } },
                { data: { id: 2 } },
                { data: { id: 3 } }
            ];

            responses.forEach(response => {
                mockedAxios.get.mockResolvedValueOnce(response);
            });

            const results = await Promise.all([
                client.requestJson(1),
                client.requestJson(2),
                client.requestJson(3),
            ]);

            results.forEach((result, index) => {
                expect(result).toEqual({ id: index + 1 });
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle timeout errors', async () => {
            const timeoutError = new Error('timeout');
            timeoutError.name = 'ECONNABORTED';
            mockedAxios.get.mockRejectedValue(timeoutError);

            await expect(client.requestJson())
                .rejects
                .toThrow('timeout');
        });

        it('should handle connection refused', async () => {
            const connError = new Error('ECONNREFUSED');
            connError.name = 'ECONNREFUSED';
            mockedAxios.get.mockRejectedValue(connError);

            await expect(client.requestJson())
                .rejects
                .toThrow('ECONNREFUSED');
        });

        it('should handle 404 responses', async () => {
            const notFoundError = {
                response: {
                    status: 404,
                    statusText: 'Not Found'
                }
            };
            mockedAxios.get.mockRejectedValue(notFoundError);

            await expect(client.requestJson())
                .rejects
                .toEqual(notFoundError);
        });

        it('should handle 500 responses', async () => {
            const serverError = {
                response: {
                    status: 500,
                    statusText: 'Internal Server Error'
                }
            };
            mockedAxios.get.mockRejectedValue(serverError);

            await expect(client.requestJson())
                .rejects
                .toEqual(serverError);
        });
    });

    describe('API Methods', () => {
        it('should correctly call requestConfig', async () => {
            const mockConfig: WbecConfigResponse = {
                cfgApSsid: 'test-ap',
                cfgApPass: 'test-pass',
            } as WbecConfigResponse;

            mockedAxios.get.mockResolvedValue({ data: mockConfig });

            const result = await client.requestConfig();

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://192.168.1.100/cfg',
                expect.objectContaining({ timeout: TEST_OPTIONS.timeout })
            );
            expect(result).toEqual(mockConfig);
        });

        it('should correctly call requestJson with boxId', async () => {
            mockedAxios.get.mockResolvedValue({ data: mockJsonResponse });

            await client.requestJson(1);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://192.168.1.100/json?id=1',
                expect.any(Object)
            );
        });

        it('should correctly call setPvValue', async () => {
            mockedAxios.get.mockResolvedValue({ data: mockPvResponse });

            const pvParams = {
                pvMode: PvMode.Pv,
                pvWatt: 1000,
                pvBatt: 0
            };

            await client.setPvValue(pvParams);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                `http://192.168.1.100/pv?pvMode=${PvMode.Pv}&pvWatt=1000&pvBatt=0`,
                expect.any(Object)
            );
        });

        it('should correctly call setCurrentLimit', async () => {
            mockedAxios.get.mockResolvedValue({ data: mockJsonResponse });

            await client.setCurrentLimit(1, 16);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://192.168.1.100/json?currLim=16&id=1',
                expect.any(Object)
            );
        });
    });
});
