var Database = JQB.Schema.Database;
var Table = JQB.Schema.Table;

describe("ParseSchema", function () {
    it("should parse simple tables and columns", function () {
        var csv = "accounts,id,char,PRI\naccounts,fname,varchar,";
        var db = new Database(csv);
        expect(db.tables.length).toEqual(1);
        expect(db.tables[0].name).toEqual('accounts');
        expect(db.tables[0].columns.length).toEqual(2);
        expect(db.tables[0].columns[0].name).toEqual('id');
        expect(db.tables[0].columns[0].isPk).toEqual(true);
        expect(db.tables[0].columns[0].datatype).toEqual('char');
        expect(db.tables[0].columns[1].name).toEqual('fname');
        expect(db.tables[0].columns[1].isPk).toEqual(false);
        expect(db.tables[0].columns[1].datatype).toEqual('varchar');
    });
});

describe("Singularize", function () {
    it("should drop the S on simple plurals", function () {
        expect(new Table("fields").singularize()).toEqual("field");
    });

    it("should change IES plurals to Y", function () {
        expect(new Table("histories").singularize()).toEqual("history");
    });

    it("should just return name otherwise", function () {
        expect(new Table("field").singularize()).toEqual("field");
    });
});

describe("GuessForeignKeys", function () {
    var csv = "accounts,id,char,PRI\n" + "accounts,name,varchar,\n" + "users,id,char,PRI\n" + "users,account_id,char,\n" + "users,name,varchar,\n";
    var db = new Database(csv);

    var assertUserAccountFk = function (fk) {
        expect(fk.primary.name).toBe('accounts');
        expect(fk.primaryColumns[0].name).toBe('id');
        expect(fk.fkOwner.name).toBe('users');
        expect(fk.fkColumns[0].name).toBe('account_id');
    };

    it("should find a simple one", function () {
        var fks = db.table('users').guessForeignKeys([db.table('accounts')]);
        expect(fks.length).toEqual(1);
        assertUserAccountFk(fks[0]);
    });

    it("should work backwards, too", function () {
        var fks = db.table('accounts').guessForeignKeys([db.table('users')]);
        expect(fks.length).toEqual(1);
        assertUserAccountFk(fks[0]);
    });
});
