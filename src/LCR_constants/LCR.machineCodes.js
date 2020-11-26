module.exports = {
	SWITCH: {
		0x00: 'BETWEEN',
		0x01: 'RUN',
		0x02: 'STOP',
		0x03: 'PRINT',
		0x04: 'SHIFT PRINT',
		0x05: 'CALIBRATE',
		0x06: null,
		0x07: 'UNAVAILABLE',
		0x08: 'PRINTING',
	},
	STATE: {
		0x00: 'RUN',
		0x10: 'STOP',
		0x20: 'END DELIVERY',
		0x30: 'AUXILIARY',
		0x40: 'SHIFT',
		0x50: 'CALIBRATE',
		0x60: 'WAIT NOFLOW',
		0x70: null,
		0x80: 'ERROR',
	},
};
