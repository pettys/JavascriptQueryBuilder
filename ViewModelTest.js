var Database = JQB.Schema.Database;
var Table = JQB.Schema.Table;

describe("ViewModelSql", function () {
    var csv = "accounts,id,char,PRI\n" + "accounts,name,varchar,\n" + "users,id,char,PRI\n" + "users,account_id,char,\n" + "users,name,varchar,\n";

    it("should build a simple one-table query", function () {
        var vm = new JQB.ViewModel({ schemaCsv: csv });
        vm.addTableToQuery(vm.schema().table('accounts'));
        expect(vm.sql()).toBe("select t0.`name`\nfrom `accounts` t0");
    });

    it("should build a simple two-table join", function () {
        var vm = new JQB.ViewModel({ schemaCsv: csv });
        vm.addTableToQuery(vm.schema().table('accounts'));
        vm.addTableToQuery(vm.schema().table('users'));
        expect(vm.sql()).toBe("select t0.`name`, t1.`name`\n" + "from `accounts` t0\n" + "join `users` t1 on t1.`account_id` = t0.`id`");
    });
});
