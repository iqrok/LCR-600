const EventEmitter = require('events');

const bitops = require(`../class/bitOperations.class`);
const __serial = require(`../class/serial.class`);

/** Constants used in building request packet **/
const __HEADER__ = 0x7E;
const __ESC__ = 0x1B;
const __POLYNOMIAL__ = 0x1021;

/** Template for request packet **/
const __TEMPLATE__ = function(to = 0x00, from = 0xff){
	this.to = to;
	this.from = from;
	this.status = 0x01;
	this.length = 0x00;
	this.data = [0x00];
};

/** Template to store flow process **/
const ___RECEIVED_DATA__ = function(lastValue = null){
	this.lastValue = lastValue;
	this.onProcess = false;
	this.sameValueTimer = 0;
	this.summary = {
		value: {
			start: null,
			finish: null,
			get total(){
				return this.finish !== null
					? this.finish - this.start
					: 0;
			},
		},
		time: {
			start: null,
			finish: null,
			get duration(){
				return this.finish !== null
					? (this.finish - this.start)
					: 0;
			},
			get _summary(){
				return this.start && this.finish
					? {
						start: this.start,
						finish: this.finish,
						duration: this.duration,
					}
					: undefined;
			},
		},
	};
};

/** List of fields available in LCR API **/
const _FIELDS = require(`../LCR_constants/LCR.fields`);

/** LIST table from LCR API **/
const _LIST = require(`../LCR_constants/LCR.list`);

/** Return Codes Description from LCR API **/
const _RCODES = require(`../LCR_constants/LCR.rcodes`);

/** Machine Code Bits Description from LCR API **/
const _MACHINE_STATUS = require(`../LCR_constants/LCR.machineStatus`);

/** Message ID Description from LCR API **/
const _MESSAGEID = require(`../LCR_constants/LCR.messageId`);

/** Variable to store parsed LCR600's responses **/
const _RECEIVED_DATA = {};

class LCR600 extends EventEmitter{
	/**
	 *	Constructor
	 *	@param {Object} config - LCR600 configuration
	 *	@param {string} config.port - Path to serial port
	 *	@param {number} config.baud - Baud Rate for serial communication
	 *	@param {number} config.LCRNodeAddress - Destination Address
	 *	@param {number} config.hostAddress - Host Source Address
	 *	@param {bool} debug - set debug state
	 * */
	constructor(config, debug = false){
		super();
		this.init(config, debug);
	};

	/**
	 *	Initialize class
	 *	@param {Object} config - LCR600 configuration
	 *	@param {string} config.port - Path to serial port
	 *	@param {number} config.baud - Baud Rate for serial communication
	 *	@param {number} config.LCRNodeAddress - Destination Address
	 *	@param {number} config.hostAddress - Host Source Address
	 *	@param {bool} debug - set debug state
	 * */
	init(config, debug = false){
		const self = this;

		self.LCRNodeAddress = config.LCRNodeAddress ? config.LCRNodeAddress : 0x00;
		self.hostAddress = config.hostAddress ? config.hostAddress : 0xff;
		self.config = config;
		self.config.baud = config.baud || 19200;
		self.debug = debug;
		self.message = new __TEMPLATE__(self.LCRNodeAddress, self.hostAddress);
		self.attributes = {};

		self._currentField = undefined;
		self._msLimit = 1000;
	};

	/**
	 *	Connect to serial port and add event listeners
	 * */
	async connect(){
		const self = this;

		self.serial = new __serial({
				...self.config,
				autoopen: false,
				parser: {
					type: 'InterByteTimeout',
					interval: 30,
				}
			}, self.debug);

		self.serial.on('open', received => {
			self._emit('open', received);
		});

		self.serial.on('error', received => {
			self._emit('error', received);
		});

		self.serial.on('close', received => {
			self._emit('close', received);
		});

		self.serial.on('data', received => {
			self._parseReceivedSerial(received);
		});

		await self.serial.connect();
	};

	/*=========== PRIVATE METHODS ===========*/

	/**
	 *	Parse received serial response from LCR600
	 *	@private
	 *	@param {Array<byte>} received - array of bytes received from LCR600
	 * */
	_parseReceivedSerial(received){
		const self = this;
		const response = self._parseResponse(received);

		if(response.data.code !== 0){
			self._unsuccessfulResponse(self._messageId, response);
			return;
		}

		if(self._messageId != undefined){
			switch(self._messageId){
				// Product Id Request
				case 0x00:
					const {status, fieldData} = response.data;

					const summary = {
							name: 'productId',
							value: self._readFieldData(fieldData, 'TEXT'),
						};

					self._setAttribute(summary.name, summary.value);
					self._emit('data', summary);
					break;

				// Get Field Request
				case 0x20:
					self._handleResponseField(response);
					break;

				// Set Field Request
				case 0x21:
					break;

				// Device Status Request
				case 0x23:
					console.log('device status', response);
					console.log('device data', response.data);
					console.log('device code', self._parseReturnCodes(response.data.code));
					console.log('------------------------------');
					break;

				// Set Device Address Request
				case 0x25:
					break;

				// Set Baud Rate Request
				case 0x7C:
					break;

				default:
					// message id will mostly probably 0x20, try to call _handleResponseField()
					self._handleResponseField(response);
					break;
			}

			self._messageId = undefined;
		} else{
			const {data} = response;
			const {status, fieldData} = data;

			switch(status){
				// status = 0x02 : handle Product Id response
				case 0x02:
					const summary = {
							name: 'productId',
							value: self._readFieldData(fieldData, 'TEXT'),
						};

					self._setAttribute(summary.name, summary.value);
					self._emit('data', summary);
					break;

				default:
					// status byte is not listed, try to call _handleResponseField()
					self._handleResponseField(response);
					break;
			}
		}
	};

	/**
	 *	emit data if only there is at least 1 listener
	 *	@private
	 *	@param {string} eventName - event name to be emitted
	 *	@param {*} value - event data, any datatype can be emitted
	 * */
	_emit(eventName, value){
		const self = this;
		if(self.listenerCount(eventName) > 0){
			self.emit(eventName, value);
		}
	};

	/**
	 *	Handle response when code is not 0
	 *	@private
	 *	@param {number} messageId - current requested message id
	 *	@param {Object} response - Parsed LCR600's response
	 * */
	_unsuccessfulResponse(messageId, response){
		const self = this;

		self._emit('failed', (()=>{
				if(self._currentField != undefined){
					const field = self._currentField;

					// remove _currentField only if success, because LCR600 will send response on queued request
					self._currentField = undefined;

					return {
						id: _MESSAGEID[messageId],
						name: self._getFieldNameById(field.id),
						...self._parseReturnCodes(response.data.code),
					};
				} else {
					return {
						id: _MESSAGEID[messageId],
						...self._parseReturnCodes(response.data.code),
					};
				}
			})());
	};

	/**
	 *	Handle response from LCR600, and emit handled data
	 *	@private
	 *	@param {Object} response - Parsed LCR600's response
	 * */
	_handleResponseField(response){
		const self = this;
		const {code, status, fieldData} = response.data;

		// if current field is empty, handling data will throw error. Return false instead
		if(self._currentField == undefined){
			return false;
		}

		const field = self._currentField;

		// remove _currentField only if success, because LCR600 will send response on queued request
		self._currentField = undefined;

		const type = field.type.toUpperCase();
		const summary = {
				name: self._getFieldNameById(field.id),
				value: self._readFieldData(fieldData, field.type),
				status,
			};

		switch(type){
			case 'LONG':
			case 'FFLOAT':
			case 'UFLOAT':
			case 'SFLOAT':
			case 'INTEGER':
			case 'VOLUME':
				const summarize = self._summarize(summary);

				if(summarize){
					const data = _RECEIVED_DATA[summary.name];

					// emit with field name, because summary is specific for each field name
					self._emit(summary.name, {
							name: summary.name,
							value: {
								meter: {
									start: data.summary.value.start,
									finish: data.summary.value.finish,
									total: Math.abs(data.summary.value.total),
								},
								time: data.summary.time._summary,
							},
							status,
						});
				}

				self._setAttribute(summary.name, summary.value);
				self._emit('data', summary);

				break;

			case 'LIST':
				const parsedList = self._parseList(summary, field.n);
				self._setAttribute(parsedList.name, parsedList.value);
				self._emit('data', parsedList);
				break;

			case 'TEXT':
				self._setAttribute(summary.name, summary.value);
				self._emit('data', summary);
				break;
		}
	};

	/**
	 *	Parse Return Codes according to LCR API Docs
	 *	@private
	 *	@param {Number} code - return code from LCR API
	 *	@returns {Object} - Object containing return code and its description
	 * */
	_parseReturnCodes(code){
		return {
				code,
				description: _RCODES[code] ? _RCODES[code] : undefined,
			};
	};

	/**
	 *	Parse LIST according to LCR API Docs
	 *	@private
	 *	@param {Object} summary - Summary of Parsed LCR600's response
	 *	@param {Number} n - LIST index. See 'List Types' in LCR API document
	 *	@returns {Object} - parsed LIST name and value
	 * */
	_parseList(summary, n){
		return {
				name: summary.name,
				value: _LIST[n] ? _LIST[n][summary.value] : summary.value,
				status: summary.status,
			};
	};

	/**
	 *	Parse VOLUME type and calculate summary when VOLUME value is changing
	 *	@private
	 *	@param {Object} data - Parsed LCR600's response
	 *	@returns {Bool} - current process is finished or not
	 * */
	_summarize(data){
		const self = this;
		let status = false;

		// create template for current data if it doesnt exist yet
		if(!_RECEIVED_DATA[data.name]){
			// set current value as lastValue when creating templates
			_RECEIVED_DATA[data.name] = new ___RECEIVED_DATA__(data.value);
		}

		// when current value is different than last value, assume flow process is started
		if(_RECEIVED_DATA[data.name].lastValue !== data.value){
			// set initial value when process started
			if(!_RECEIVED_DATA[data.name].onProcess){
				_RECEIVED_DATA[data.name].summary.value.start = _RECEIVED_DATA[data.name].lastValue; // use lastValue as start, avoiding gap between last finish value and current start value
				_RECEIVED_DATA[data.name].summary.time.start = new Date();
				_RECEIVED_DATA[data.name].onProcess = true;

				// reset finish values
				_RECEIVED_DATA[data.name].summary.value.finish = null;
				_RECEIVED_DATA[data.name].summary.time.finish = null;
			}

			// always reset counter when value is changing
			_RECEIVED_DATA[data.name].sameValueTimer = Date.now();
		}

		// process is assumed as finished when lastValue is same as currentValue for ${self._msLimit}ms
		if(
			_RECEIVED_DATA[data.name].onProcess
			&& _RECEIVED_DATA[data.name].lastValue === data.value
			&& ((Date.now() - _RECEIVED_DATA[data.name].sameValueTimer) > self._msLimit || self._interruptSummarize === data.name)
		){
			// assign last value when process is finished
			_RECEIVED_DATA[data.name].summary.value.finish = data.value;
			_RECEIVED_DATA[data.name].summary.time.finish = new Date(Date.now() - (self._interruptSummarize === data.name ? 0 : self._msLimit)); // finished time is compensated with delay ms
			_RECEIVED_DATA[data.name].onProcess = false;

			// reset counter
			_RECEIVED_DATA[data.name].sameValueTimer = Date.now();

			// reset interrupt summary name
			if(self._interruptSummarize === data.name){
				self._interruptSummarize = undefined;
			}

			status |= true;
		}

		// always set last value
		_RECEIVED_DATA[data.name].lastValue = data.value;

		return status;
	};

	/**
	 *	Read buffer according to its type
	 *	@private
	 *	@param {Buffer} buffer - buffer from LCR600's response
	 *	@param {String} type - buffer type
	 *	@returns {Number|String} - Translated Buffer
	 * */
	_readFieldData(buffer, type){
		try{
			type = type.toUpperCase();
			switch(type){
				case 'TEXT':
					// cut last index, because it contains '\0'
					return buffer.slice(0, buffer.length-1).toString('utf8');
					break;

				case 'LONG':
				case 'VOLUME':
					return buffer.readInt32BE();
					break;

				case 'FFLOAT':
					return buffer.readDoubleBE();
					break;

				case 'UFLOAT':
				case 'SFLOAT':
					return buffer.readFloatBE();
					break;

				case 'BYTE':
				case 'LIST600':
				case 'LIST1000':
				case 'LIST':
					return buffer.readInt8();
					break;

				case 'INTEGER':
					return buffer.readInt16BE();
					break;

				default:
					throw `type '${type} is not found'`
					break;
			};
		} catch(error){
			console.error('_readFieldData Error:', buffer, error);
			return null;
		}
	};

	/**
	 *	Get field name by id
	 *	@private
	 *	@param {Number} id - Field id number
	 *	@returns {String} - field's name
	 * */
	_getFieldNameById(id){
		const self = this;

		// instead of traversing object each time, make an Object which translates id to its corresponding field name
		if(!self._fieldNames){
			self._fieldNames = {};

			for(const key in _FIELDS){
				self._fieldNames[_FIELDS[key].id] = key;
			}
		}

		return self._fieldNames[id];
	};

	/**
	 *	Request to LCR600 to get data via serialport. MessageId = 0x20
	 *	@private
	 *	@param {Number} fieldNum - LCR600's field number
	 *	@param {Number} [sync=false] - set the synchroniztion bit
	 *	@returns {Bool} - write status
	 * */
	_getFieldData(fieldNum, sync = false){
		const self = this;

		self._messageId = 0x20;

		const packet = self.CRCinit()
			.to()
			.from()
			.identifier()
			.sync(sync)
			.data([self._messageId, fieldNum])
			.build();

		return self.serial.write(packet);
	};

	/**
	 *	Set LCR600 Data field. MessageId = 0x21
	 *	@private
	 *	@param {Number} fieldNum - LCR600's field number
	 *	@param {Number} [sync=false] - set the synchroniztion bit
	 *	@returns {Bool} - write status
	 * */
	_setFieldData(fieldNum, sync = false){
		const self = this;

		self._messageId = 0x21;

		const packet = self.CRCinit()
			.to()
			.from()
			.identifier()
			.sync(sync)
			.data([self._messageId, fieldNum])
			.build();

		return self.serial.write(packet);
	};

	/**
	 *	Parse LCR600 response. Read LCR API Document page #3
	 *	@private
	 *	@param {Number[]} raw - array of bytes from LCR600's response
	 *	@returns {Object[]} - Parsed response
	 * */
	_parseResponse(raw){
		const self = this;
		const len = raw.length;

		return {
			header: [raw[0], raw[1]],
			to: raw[2],
			from: raw[3],
			status: raw[4],
			length: raw[5],
			_data: raw.slice(6, raw[5]+6),  // data start from index 6 until length+6
			get data(){
				const code = this._data[0];

				return code === 0
					? {
						code,
						status: self._parsedDevStatus(this._data[1]),
						fieldData: this._data.slice(2),
					}
					: {code};
			},
			CRC: [raw[len-2], raw[len-1]]
		};
	};

	/**
	 *	Parsed device status in data packet
	 *	@private
	 *	@param {byte} _byte - device status byte
	 *	@returns {Object} - current device status
	 * */
	_parsedDevStatus(_byte){
		const self = this;

		const switchByte = _byte & 0x0f;
		const stateByte = _byte & 0xf0;

		// emit & change last switch pos, if only switch pos is not 0x00 (BETWEEN)
		if(switchByte !== self._lastSwitchByte && switchByte !== 0x00){
			// dont emit on startup, when last switch pos is still undefined
			if(self._lastSwitchByte != undefined){
				self._emit('switch', {
						from: {
							code: self._lastSwitchByte,
							description: _MACHINE_STATUS.DEVICE_STATUS.SWITCH[self._lastSwitchByte],
						},
						to: {
							code: switchByte,
							description: _MACHINE_STATUS.DEVICE_STATUS.SWITCH[switchByte],
						},
					});
			}

			self._lastSwitchByte = switchByte;
		}

		return {
			code: _byte,
			switch: {
				code: switchByte,
				description: _MACHINE_STATUS.DEVICE_STATUS.SWITCH[switchByte],
			},
			state: {
				code: stateByte,
				description: _MACHINE_STATUS.DEVICE_STATUS.STATE[stateByte],
			},
		};
	};

	/**
	 *	Set attributes on current process
	 *	@private
	 *	@param {String} key - attribute's name
	 *	@param {Number|String} value - attribute's value
	 *	@returns {Object} - current process's attributes
	 * */
	_setAttribute(key, value){
		const self = this;
		self.attributes[key] = value;
		return self.attributes[key];
	};

	/*=========== METHODS FOR BUILDING PACKET ===========*/

	/**
	 *	Init CRC when requesting to LCR600
	 *	(Chained method)
	 *	@returns {Object} - returns this for chaining
	 * */
	CRCinit(){
		this.CRC = __HEADER__ << 8 | __HEADER__;
		return this;
	};

	/**
	 *	Set LCR Node Address Destination. If addr null, will use what defined in config
	 *	(Chained method)
	 *	@param {Number} [addr=null] - address between 0x00 - 0xfa
	 *	@returns {Object} - returns this for chaining
	 * */
	to(addr = null){
		this.message.to = addr != null ? addr : this.LCRNodeAddress;

		return this;
	};

	/**
	 *	Set Host Address. If addr null, will use what defined in config
	 *	(Chained method)
	 *	@param {Number} [addr=null] - address between 0x00 - 0xff
	 *	@returns {Object} - returns this for chaining
	 * */
	from(addr = null){
		this.message.from = addr != null ? addr : this.hostAddress;

		return this;
	};

	/**
	 *	Toggle message identifier, to differentiate between messages
	 *	(Chained method)
	 *	@returns {Object} - returns this for chaining
	 * */
	identifier(){
		this.message.status = bitops
			.use(this.message.status)
			.bit(0)
			.toggle();

		return this;
	};

	/**
	 *	Set synchronization status. Set to true only on first request
	 *	(Chained method)
	 *	@param {Bool} [isSync=false] - Set the synchroniztion bit
	 *	@returns {Object} - returns this for chaining
	 * */
	sync(isSync = false){
		this.message.status = bitops
			.use(this.message.status)
			.bit(1)
			.set(+isSync);

		return this;
	};

	/**
	 *	Set data to request
	 *	(Chained method)
	 *	@param {Number[]} data - data must be in form of array of bytes
	 *	@returns {Object} - returns this for chaining
	 * */
	data(data = [0x00]){
		this.message.data = data;
		this.message.length = this.message.data.length;

		return this;
	};

	/**
	 *	Build request packet, including calculating CRC
	 *	@returns {Number[]} - built request packet to send to LCR600
	 * */
	build(){
		const self = this;
		const message = [];

		/**
		 *	Update CRC value when appending byte into packet
		 * */
		const updateCRC = (byte) => {
			if(self.CRC != null){
				for(let bit = 7; bit >= 0; --bit){
					const XORFlag = (self.CRC & 0x8000) != 0x0000;

					self.CRC <<= 1;
					self.CRC |= (byte >> bit) & 0x01;

					if(XORFlag){
						self.CRC ^= __POLYNOMIAL__;
					}
				}
			}
		};

		/**
		 *	Append array of bytes into packet and update CRC value
		 * */
		const appendBytes = (arrByte) => {
				const appended = [];
				for(const byte of arrByte){
					if(byte === __ESC__ || byte === __HEADER__){
						appended.push(__ESC__);
						updateCRC(__ESC__);
					}

					appended.push(byte);
					updateCRC(byte);
				}

				return appended;
			};

		for(const key in self.message){
			const item = self.message[key];
			message.push(...appendBytes(Array.isArray(item) ? item : [item]));
		}

		return [
				__HEADER__,
				__HEADER__,
				...message,
				(self.CRC & 0x00FF) >> 0,
				(self.CRC & 0xFF00) >> 8,
			];
	};

	/*=========== GENERAL METHODS ===========*/

	/**
	 *	Request to LCR600 to get ProductId via serialport. MessageId = 0x00
	 *	@param {Bool} [sync=false] - Set the synchroniztion bit
	 *	@returns {Bool} - write status
	 * */
	getProductID(sync = false){
		const self = this;

		self._messageId = 0x00;

		const packet = self.CRCinit()
			.to()
			.from()
			.identifier()
			.sync(sync)
			.data([self._messageId])
			.build();

		return self.serial.write(packet);
	};

	/**
	 *	Request to LCR600 to get Device Status via serialport. MessageId = 0x23
	 *	@param {Bool} [sync=false] - Set the synchroniztion bit
	 *	@returns {Bool} - write status
	 * */
	getDeviceStatus(sync = false){
		const self = this;

		self._messageId = 0x23;

		const packet = self.CRCinit()
			.to()
			.from()
			.identifier()
			.sync(sync)
			.data([self._messageId])
			.build();

		return self.serial.write(packet);
	};

	/**
	 *	Get Field Data
	 *	@param {String} fieldName - fieldName is same as in LCR API Table page #26
	 *	@param {Bool} [sync=false] - Set the synchroniztion bit
	 *	@returns {Bool} - write status
	 * */
	getData(fieldName, sync = false){
		if(!fieldName){
			throw 'fieldName is Undefined';
		}

		const self = this;
		self._currentField = _FIELDS[fieldName];

		return self._getFieldData(self._currentField.id);
	};

	/**
	 *	Request attributes from LCR600, i.e. Meter Id, unit in use, etc
	 *	@param {String} fieldName - Field Name of requested attribute value
	 *	@returns {Object} - current process's attributes
	 * */
	requestAttribute(fieldName){
		const self = this;

		const __requestData = () => new Promise(async (resolve, reject) => {
				await self.getData(fieldName);

				if(!self.attributes[fieldName]){
					setTimeout(()=>{
							resolve(__requestData());
						}, 100);
				} else{
					resolve(self.attributes)
				}
			});

		return __requestData();
	};

	/**
	 *	Get attributes on current process
	 *	@param {String} key - attribute's name
	 *	@param {Bool} [onlyValue=true] - returns as object or value only
	 *	@returns {Number|String|Object} - if key is falsy, return entire object, otherwise return defined key
	 * */
	getAttribute(key, onlyValue = true){
		const self = this;
		return key
			? onlyValue ? self.attributes[key] : {[key]: self.attributes[key]}
			: self.attributes;
	};

	/**
	 *	Set the amount of milliseconds to wait until number data stays the same and considered as trigger to summarize data
	 *	@param {Number} [msLimit=1000] - time to wait in milliseconds
	 * */
	setWaitingTime(msLimit = 1000){
		const self = this;
		self._msLimit = msLimit;
	};

	/**
	 *	Set Device Address. MessageId = 0x25
	 *	@throws Will throw Error if deviceAddress is not number
	 *	@param {Number} deviceAddress - new LCR600's node address
	 *	@returns {Bool} - write status
	 * */
	setDeviceAddress(deviceAddress){
		const self = this;

		if(typeof(deviceAddres) !== 'number'){
			throw 'Device address must be a number data type';
		}

		self._messageId = 0x25;

		const packet = self.CRCinit()
			.to()
			.from()
			.identifier()
			.sync()
			.data([self._messageId, deviceAddres])
			.build();

		self.LCRNodeAddress = deviceAddress;

		return self.serial.write(packet);
	};

	/**
	 *	Set LCR600 Baud Rate. MessageId = 0x7C
	 *	Accepted baudrates are 57600, 19200, 9600, 4800, and 2400
	 *	@throws Will throw error if provided baud rate is not in accepted ones
	 *	@param {Number} baudRate - new LCR600's baudRate
	 *	@returns {Bool} - write status
	 * */
	setBaudRate(baudRate = 19200){
		const self = this;
		const baudIX = {
				57600: 0,
				19200: 1,
				9600: 2,
				4800: 3,
				2400: 4,
			};

		if(baudIX[baudRate] == undefined){
			throw 'Accpeted Baud Rate: 57600, 19200, 9600, 4800, 2400';
		}

		self._messageId = 0x7C

		const packet = self.CRCinit()
			.to()
			.from()
			.identifier()
			.sync()
			.data([self._messageId, baudIX[baudRate]])
			.build();

		return self.serial.write(packet);
	};

	/**
	 *	Interrupr summary calculation. Call if you want to ger summary immediately wihtout waiting for waitingTime to be elapsed
	 *	@param {string} fieldName - field name which summary want to be interrupted
	 *	@returns {Bool} - write status
	 * */
	interruptSummary(fieldName){
		const self = this;
		self._interruptSummarize = fieldName;

		// exec getData in order to get summary calculated
		return self.getData(fieldName);
	};
}

module.exports = LCR600;
