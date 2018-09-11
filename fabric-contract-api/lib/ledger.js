


class Ledger {

	/**
	 * Access the ledger within specific region (eg WORLDSTATE) or private data
	 * Type that defines the schema of the data within this ledger.
	 *
	 * @param {String} region WORLDSTATE / <name of private data>
	 * @param {String} type  Type that defines the schema of the data within this ledger
	 * @return {Ledger} instance of a ledger to use
	 */
	static accessLedger(region, type)
	{

	}

	/**
	 * Add a new entry to the ledger
	 * @param {Entry} entry entry to add to the ledger
	 * */
	append(entry){

	}


	/**
	 * Using the key values of this entry, adjust the values on the ledger to match.
	 * @param {Entry} entry adjust this entry to the values as specified
	 */
	adjust(entry){

	}

	/**
	 * Remove the entry from the ledger; it's not actually removed - by put 'beyond use'
	 * Only the ID fields are used
	 *
	 * Optional: could mandate that the values of the entry shold match the ledger otherwise
	 * this call is rejected
	 *
	 * @param {Entry} entry the entry that needs to be 'deleted' from the ledger
	 */
	strikeout(entry){

	}

	/**
	 * Find an entry within the ledger based on the key fields
	 *
	 * @param {Entry} entry object with keys that are used for serach
	 */
	locate(entry){

	}

}

/**
 * Class of 'entries' within the ledger, should be subclassed to provide specific data storage and serialization
 */
class Entry {

	/**
	 *
	 * @param {String} type  Type that defines the schema of the data within this entry
	 * @param {String[]} keys one or more primary keys (array)
	 */
	constructor(type,keys){

	}

	/**
	 *
	 * @return {buffer} the serialized format of this entry for ledger storage
	 */
	serialize(){

	}

	/** Takes the buffer data and returns the Entry that matches this
	 * Assumed that the data is self-describing in that it will contain the information on how to create
	 * an object.
	 *
	 * @param {buffer} buffer  data to form into an object
	 * @return {Entry} entry instance to return
 	 */
	static deserialize(buffer){

	}


}


//-----------  EXAMPLE USE



class MyContract extends Contract {

	issuePapaer(paperId){

		let paperLedger = Ledger.accessLedger(WORLDSTATE,'org.exampe.papernet.Paper');
		paperLedger.append(new Paper(paperId));

	}

}

class Paper extends Entry {

	constructor(paperId){
		super('org.exampe.papernet.Paper',[paperId]);
	}

	getOwner(){

	}

	getFaceValue(){

	}

}
