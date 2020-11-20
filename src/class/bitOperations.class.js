class bitops{
	convertBase(num, from, to) {
		return parseInt(num, from).toString(to);
	};

	dec2bin(num){
		return this.convertBase(num, 10, 2);
	};

	bin2dec(num){
		return this.convertBase(num, 2, 10);
	};

	hex2bin(num){
		return this.convertBase(num, 16, 2);
	};

	bin2hex(num){
		return this.convertBase(num, 2, 16);
	};

	hex2dec(num){
		return this.convertBase(num, 16, 10);
	};

	dec2hex(num){
		return this.convertBase(num, 10, 16);
	};

	/** I remember those days when avr-gcc was a thing for me **/
	setBit(num, bitNumber){
		return num | (1 << bitNumber);
	};

	clearBit(num, bitNumber){
		return num & ~(1 << bitNumber);
	};

	toggleBit(num, bitNumber){
		return num ^ (1 << bitNumber);
	};

	readBit(num, bitNumber){
		return (num & (1 << bitNumber)) >> bitNumber;
	};

	/* chained ones, they're ugly */
	/**
	 *	USAGE :
	 *	bitops.use(number).bit(bitNumber).set(bitValue);
	 *	bitops.use(number).bit(bitNumber).get();
	 *	bitops.use(number).bit(bitNumber).toggle();
	 *
	 *	Other than what listed above, will throw error
	 * **/

	use(num){
		if(Number.isInteger(num)){
			this.__used = {
					num,
				};

			return this;
		}
		else{
			throw 'Error: number must be integer';
		}
	}

	bit(bitNumber){
		if(Number.isInteger(bitNumber)){
			this.__used.bitNumber = bitNumber;

			return this;
		}
		else{
			delete this.__used;
			throw 'Error: bitNumber is not integer';
		}

	};

	get(){
		if(this.__used.num == null || this.__used.bitNumber == null){
			throw 'Error: should call use() and bit() before calling get()';
		}

		const value = this.readBit(this.__used.num, this.__used.bitNumber);
		delete this.__used;

		return value;
	};

	set(bitValue){
		if(this.__used.num == null || this.__used.bitNumber == null){
			throw 'Error: should call use() and bit() before calling set()';
		}

		if(Number.isInteger(bitValue)){
			const value = +bitValue & 1
				? this.setBit(this.__used.num, this.__used.bitNumber)
				: this.clearBit(this.__used.num, this.__used.bitNumber);

			delete this.__used;

			return value;
		}
		else{
			throw 'Error: bitValue is not integer';
		}
	};

	toggle(){
		if(this.__used.num == null || this.__used.bitNumber == null){
			throw 'Error: should call use() and bit() before calling toggle()';
		}

		const value = this.toggleBit(this.__used.num, this.__used.bitNumber);
		delete this.__used;

		return value;
	};

	read(){
		return this.get();
	};

	write(bitValue){
		return this.set(bitValue);
	};
}

module.exports = new bitops();
