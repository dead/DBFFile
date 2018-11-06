'use strict';
import * as path from 'path';
import * as _ from 'lodash';
import {expect} from 'chai';
import * as DBFFile from 'dbffile';

describe('Updating a DBF file', () => {

    let tests = [
        {
            filename: 'PYACFL.DBF',
            rowCount: 45,
            firstRow: { AFCLPD: 'W', AFHRPW: 2.92308, AFLVCL: 0.00, AFCRDA: new Date(1999, 2, 25), AFPSDS: '' },
            delCount: 30,
            error: null
        }
    ];

    tests.forEach(test => {
        it(test.filename, async () => {
            let filepath = path.join(__dirname, `./fixtures/${test.filename}`);
            let dbf = await (DBFFile.open(filepath));
            let rows = await (dbf.readRecords(500));

            const old = rows[5].AFHRPW;
            await dbf.updateRecord(rows[5].RECNO, {AFHRPW: 2.3});
            
            dbf = await (DBFFile.open(filepath));
            rows = await (dbf.readRecords(500));

            expect(rows[5].AFHRPW).equals(2.3);

            await dbf.updateRecord(rows[5].RECNO, {AFHRPW: old});
        });
    });
});
