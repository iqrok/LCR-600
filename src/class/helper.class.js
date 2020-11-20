const date = require('date-and-time');

class helper{
	msToHms(duration, withms = false) {
		let milliseconds = parseInt((duration % 1000) / (+withms || 1)),
			seconds = parseInt((duration / 1000) % 60),
			minutes = parseInt((duration / (1000 * 60)) % 60),
			hours = parseInt((duration / (1000 * 60 * 60)) % 24);

		hours = (hours < 10) ? "0" + hours : hours;
		minutes = (minutes < 10) ? "0" + minutes : minutes;
		seconds = (seconds < 10) ? "0" + seconds : seconds;

		return withms
			? hours + ":" + minutes + ":" + seconds + "." + milliseconds
			: hours + ":" + minutes + ":" + seconds;
	}

	secondsToHms(duration, withms = false){
		return this.msToHms(this.secondsToMs(duration), withms);
	};

	secondsToMs(secs){
		return secs * 1000;
	};

	msToSeconds(ms, asMs = true){
		return Math.round(ms / 1000) * (asMs ? 1000 : 1);
	};

	isValidDate(_date){
		return _date && Object.prototype.toString.call(_date) === "[object Date]" && !isNaN(_date);
	};

	formatDate(_date, _format = 'YYYY-MM-DD HH:mm:ss'){
		if(!this.isValidDate(_date)){
			return null;
		}

		return date.format(_date, _format);
	};

	arrayFindByValue(arr, key, value){
		if(!Array.isArray(arr)){
			return false;
		}

		for(const item of arr){
			if(item[key] === value){
				return item;
			}
		}

		return null;
	};

	sleep(ms){
		return new Promise(resolve => setTimeout(resolve, ms))
	};

	round(num, dec = 2){
		const pow = Math.pow(10, dec);
		return Math.round((num + Number.EPSILON) * pow) / pow;
	};

	hmsToMs(hms){
		if(!(date.isValid(hms, 'HH:mm:ss') || date.isValid(hms, 'HH:mm:ss.SSS') || date.isValid(hms, 'HH:mm:ss.SS') || date.isValid(hms, 'HH:mm:ss.S'))){
			throw `Invalid Hms format ${hms}`;
		}

		const comp = hms.split(/[\:|\.]+/);
		const multipliers = [
				3600000, // hours
				60000, // minutes
				1000, // seconds
				1 // ms
			];

		return comp.reduce((acc, val, idx) => acc + (+val * multipliers[idx]), 0);
	};

	clockHMSDiff(first, last, assumeTommorow = true){
		const prefixDate = this._prefixDate || '1970-01-01';
		const dayInMs = 24 * 3600 * 1000;

		//use ISO String to keep Date from being adjusted by timezone
		const _date = {
				first : new Date(`${prefixDate}T${first}Z`),
				last : new Date(`${prefixDate}T${last}Z`)
			};

		// this method accept only start time is less than end time
		// otherwise assume the last time is tommorow, unless assumeTommorow is false
		if(_date.first > _date.last && assumeTommorow){
			_date.last = new Date(_date.last.getTime() + dayInMs);
		}

		delete this._prefixDate;

		return _date.last - _date.first;
	};

	clockHMSIsBetween(needle, first, last, tolerance = 0){
		const prefixDate = this._prefixDate || '1970-01-01';
		const dayInMs = 24 * 3600 * 1000;

		//use ISO String to keep Date from being adjusted by timezone
		const _date = {
				needle : new Date(`${prefixDate}T${needle}Z`),
				first : new Date(`${prefixDate}T${first}Z`),
				last : new Date(`${prefixDate}T${last}Z`),
			};

		//tolerance in ms
		if(tolerance){
			if(tolerance.seconds){
				tolerance = tolerance.seconds * 1000;
			}

			_date.first = new Date(_date.first.getTime() - tolerance);
			_date.last = new Date(_date.last.getTime() + tolerance);
		}

		// if end time is less than start time, assume end time is in the next day
		if(_date.last <= _date.first){
			//if needle is less than start time and end time, assume needle is in the next day
			if(_date.needle < _date.last && _date.needle < _date.first){
				_date.needle = new Date(_date.needle.getTime() + dayInMs); //add a day
			}

			_date.last = new Date(_date.last.getTime() + dayInMs);//add a day
		}

		delete this._prefixDate;

		return _date.first < _date.needle && _date.last > _date.needle;
	};

	set(key, val){
		this[`_${key}`] = val;
		return this;
	};
}

module.exports = new helper();
