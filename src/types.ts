export interface WbecDeviceOptions {
    timeout?: number;
    maxRequestInterval?: number;
}


export type BoxId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type BusId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export type WbecJsonResponse = {
    wbec: Wbec
    box: Array<Box | null>
    modbus: Modbus
    rfid: Rfid
    pv: Pv
    wifi: Wifi
}

export type Wbec = {
    version: string
    bldDate: string
    timeNow: string
    enwg14a: number
    enwgErr: number
}

export type Box = {
    busId: BusId
    version: string
    chgStat: number
    currL1: number
    currL2: number
    currL3: number
    pcbTemp: number
    voltL1: number
    voltL2: number
    voltL3: number
    extLock: number
    power: number
    energyP: number
    energyI: number
    energyC: number
    currMax: number
    currMin: number
    logStr: string
    wdTmOut: number
    standby: number
    remLock: number
    currLim: number
    currFs: number
    lmReq: number
    lmLim: number
    resCode: string
    failCnt: number
}

export type Modbus = {
    state: State
}

export type State = {
    lastTm: number
    millis: number
}

export type Rfid = {
    enabled: boolean
    release: boolean
    lastId: string
}
export enum PvMode {
    Disabled = 0,
    Off = 1,
    Pv = 2,
    PvWithMin,
}

export type Pv = {
    mode: PvMode
    watt: number
    wbId: BoxId
}

export type Wifi = {
    mac: string
    rssi: number
    signal: number
    channel: number
}
export type WbecPvResponse = {
    box: PvBox
    modbus: PvModbus
    pv: PvPv
}

export type PvBox = {
    chgStat: number
    power: number
    currLim: number
    resCode: string
}

export type PvModbus = {
    millis: number
}

export type PvPv = {
    mode: PvMode
    watt: number
    batt: number
}

export type WbecConfigResponse = {
    cfgApSsid: string
    cfgApPass: string
    cfgCntWb: number
    cfgMbCycleTime: number
    cfgMbDelay: number
    cfgMbTimeout: number
    cfgStandby: number
    cfgFailsafeCurrent: number
    cfgMqttIp: string
    cfgMqttPort: number
    cfgMqttUser: string
    cfgMqttPass: string
    cfgMqttWattTopic: string
    cfgMqttWattJson: string
    cfgNtpServer: string
    cfgFoxUser: string
    cfgFoxPass: string
    cfgFoxDevId: string
    cfgPvActive: number
    cfgPvCycleTime: number
    cfgPvLimStart: number
    cfgPvLimStop: number
    cfgPvPhFactor: number
    cfgPvOffset: number
    cfgPvCalcMode: number
    cfgPvInvert: number
    cfgPvInvertBatt: number
    cfgPvMinTime: number
    cfgPvOffCurrent: number
    cfgPvHttpIp: string
    cfgPvHttpPath: string
    cfgPvHttpJson: string
    cfgPvHttpPort: number
    cfgTotalCurrMax: number
    cfgLmChargeState: number
    cfgRestoreLastReq: number
    cfgHwVersion: number
    cfgWifiSleepMode: number
    cfgLoopDelay: number
    cfgKnockOutTimer: number
    cfgShellyIp: string
    cfgInverterIp: string
    cfgInverterType: number
    cfgInverterPort: number
    cfgInverterAddr: number
    cfgInvSmartAddr: number
    cfgInvRegPowerInv: number
    cfgInvRegPowerInvS: number
    cfgInvRegPowerMet: number
    cfgInvRegPowerMetS: number
    cfgInvRegToGrid: number
    cfgInvRegFromGrid: number
    cfgInvRegInputGrid: number
    cfgInvRegBattery: number
    cfgBootlogSize: number
    cfgBtnDebounce: number
    cfgWifiConnectTimeout: number
    cfgResetOnTimeout: number
    cfgEnergyOffset: number
    cfgDisplayAutoOff: number
    cfgWifiAutoReconnect: number
    cfgWifiScanMethod: number
    cfgLedIp: number
    cfgWifiOff: number
    cfgChargeLog: number
}

export type WbecStatusResponse = {
    oem: string
    typ: string
    box: string
    version: string
    car: string
    err: string
    alw: string
    amp: string
    amx: string
    stp: string
    pha: string
    tmp: string
    dws: string
    dwo: string
    uby: string
    eto: string
    nrg: number[]
    fwv: string
    sse: string
    ama: string
    ust: string
    ast: string
}

export type WbecChargeLogResponse = {
    line: ChargeLogEntry[]
}

export type ChargeLogEntry = {
    timestamp: number
    duration: number
    energy: number
    user: number
    box: number
}

export type ErrorHandler = (error: any) => void
