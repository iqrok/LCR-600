module.exports = {
	DEVICE_STATUS: {
		SWITCH: {
			0x00: 'BETWEEN',
			0x01: 'RUN',
			0x02: 'STOP',
			0x03: 'PRINT',
			0x04: 'SHIFT_PRINT',
			0x05: 'CALIBRATE',
			0x06: null,
			0x07: 'UNAVAILABLE',
			0x08: 'PRINTING',
		},
		STATE: {
			0x00: 'RUN',
			0x10: 'STOP',
			0x20: 'END_DELIVERY',
			0x30: 'AUXILIARY',
			0x40: 'SHIFT',
			0x50: 'CALIBRATE',
			0x60: 'WAIT_NOFLOW',
			0x70: null,
			0x80: 'ERROR',
		},
	},

	PRINTER_STATUS: {
		0x00: 'SUCCESS',
		0x01: 'DELIVERY_TICKET',
		0x02: 'SHIFT_TICKET',
		0x04: 'DIAGNOSTIC_TICKET',
		0x08: 'USER_PRINT',
		0x10: 'OUT_OF_PAPER',
		0x20: 'OFFLINE',
		0x40: 'ERROR_WARNING',
		0x80: 'BUSY',
	},

	DELIVERY_STATUS: {
		0x0000: 'SUCCESS',
		0x0001: 'ERROR_CHECKSUM',
		0x0002: 'ERROR_TEMPERATURE',
		0x0004: 'ERROR_WATCHDOG_TIMEOUT',
		0x0008: 'ERROR_VCF_SETUP',
		0x0010: 'ERROR_VCF_DOMAIN',
		0x0020: 'ERROR_METER_CALIBRATION',
		0x0040: 'ERROR_PULSER_FAILURE',
		0x0080: 'PRESET_STOP',
		0x0100: 'NOFLOW_STOP',
		0x0200: 'STOP_REQUEST',
		0x0400: 'END_DELIVERY_REQUEST',
		0x0800: 'ERROR_POWER_FAILURE',
		0x1000: 'ERROR_PRESET',
		0x2000: 'ERROR_LAPPAD_DISCONNECTED',
		0x4000: 'ERROR_PRINTER_BUSY_OR_OFFLINE',
		0x8000: 'ERROR_DATA_ACCESS',
	},

	DELIVERY_CODE: {
		0x0000: 'SUCCESS',
		0x0001: 'PENDING_DELIVERY_TICKET',
		0x0002: 'PENDING_SHIFT_TICKET',
		0x0004: 'FLOW_ACTIVE',
		0x0008: 'DELIVERY_ACTIVE',
		0x0010: 'GROSS_PRESET_ACTIVE',
		0x0020: 'NET_PRESET_ACTIVE',
		0x0040: 'GROSS_PRESET_STOP',
		0x0080: 'NET_PRESET_STOP',
		0x0100: 'TVC_ACTIVE',
		0x0200: 'SOLENOID1_CLOSED',
		0x0400: 'DELIVERY_STARTED',
		0x0800: 'NEW_DELIVERY_QUEUED',
		0x1000: 'WARNING_DATA_ACCESS',
		0x2000: 'CONFIG_EVENT',
		0x4000: 'CALIB_EVENT',
		0x8000: 'TRANSACTION_RECORD_SAVED',
	},
};
