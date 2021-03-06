/** FIELDS are translated into object from LCR API Field Numbers Table **/
module.exports = {
	ProductNumber_DL: {
			id: 0,
			type: 'LIST',
			n: 0,
		},
	ProductCode_DL: {
			id: 1,
			type: 'TEXT',
		},
	GrossQty_NE: {
			id: 2,
			type: 'VOLUME',
		},
	NetQty_NE: {
			id: 3,
			type: 'VOLUME',
		},
	FlowRate_NE: {
			id: 4,
			type: 'VOLUME',
		},
	ProductDescriptor_DL: {
			id: 11,
			type: 'TEXT',
		},
	ShiftGross_NE: {
			id: 13,
			type: 'VOLUME',
		},
	ShiftNet_NE: {
			id: 14,
			type: 'VOLUME',
		},
	GrossTotal_WM: {
			id: 17,
			type: 'VOLUME',
		},
	NetTotal_WM: {
			id: 18,
			type: 'VOLUME',
		},
	UnitID_UL: {
			id: 24,
			type: 'TEXT',
		},
	NoFlowTimer_DL: {
			id: 25,
			type: 'INTEGER',
		},
	Temp_WM: {
			id: 33,
			type: 'SFLOAT',
		},
	TempOffset_WM: {
			id: 34,
			type: 'SFLOAT',
		},
	TempScale_WM: {
			id: 35,
			type: 'LIST',
			n: 10,
		},
	MeterID_WM: {
			id: 36,
			type: 'TEXT',
		},
	QtyUnits_WM: {
			id: 38,
			type: 'LIST',
			n: 4,
		},
	Decimals_WM: {
			id: 39,
			type: 'LIST',
			n: 14,
		},
	FlowDirection_WM: {
			id: 40,
			type: 'LIST',
			n: 21,
		},
	TimeUnit_WM: {
			id: 41,
			type: 'LIST',
			n: 11,
		},
	CalibrationEvent_NE: {
			id: 42,
			type: 'LONG',
		},
	ConfigurationEvent_NE: {
			id: 43,
			type: 'LONG',
		},
	GrossCount_NE: {
			id: 44,
			type: 'VOLUME',
		},
	NetCount_NE: {
			id: 45,
			type: 'VOLUME',
		},
	Printer_WM: {
			id: 56,
			type: 'LIST',
			n: 19,
		},
	SupplyVoltage_NE: {
			id: 68,
			type: 'UFLOAT',
		},
	SerialID_FL: {
			id: 80,
			type: 'TEXT',
		},
	AvgFlowRate: {
			id: 126,
			type: 'VOLUME',
		},
	CompFlowRate: {
			id: 127,
			type: 'VOLUME',
		},
};
