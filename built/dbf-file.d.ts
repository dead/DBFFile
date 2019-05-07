/** Open an existing DBF file. */
export declare function open(path: string): Promise<DBFFile>;
/** Create a new DBF file with no records. */
export declare function create(path: string, fields: Field[]): Promise<DBFFile>;
/** Represents a DBF file. */
export declare class DBFFile {
    /** Full path to the DBF file. */
    path: string;
    /** Total number of records in the DBF file. */
    recordCount: number;
    /** Metadata for all fields defined in the DBF file. */
    fields: Field[];
    /** Append the specified records to this DBF file. */
    append(records: any[]): Promise<DBFFile>;
    /** Read a subset of records from this DBF file. */
    readRecords(maxRows?: number): Promise<any[]>;
    updateRecord(RECNO: number, data: any): Promise<void>;
    _recordsRead: number;
    _headerLength: number;
    _recordLength: number;
    _ignoreDeleted: boolean;
    _returnNull: boolean;
    _returnDate: boolean;
    _memoFile: any;
}
/** Structural typing for DBF field metadata. */
export interface Field {
    name: string;
    type: string;
    size: number;
    decs: number;
}
