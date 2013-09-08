
/// <reference path="Scripts/typings/jasmine/jasmine.d.ts" />
/// <reference path="ViewModel.ts" />
/// <chutzpah_reference path="./Scripts/knockout-2.3.0.js" />

var Database = JQB.Schema.Database;
var Table = JQB.Schema.Table;

describe("ViewModelSql", () => {

	var csv
		= "accounts,id,char,PRI\n"
		+ "accounts,name,varchar,\n"
		+ "users,id,char,PRI\n"
		+ "users,account_id,char,\n"
		+ "users,name,varchar,\n";

	it("should build a simple one-table query", () => {
		var vm = new JQB.ViewModel({ schemaCsv: csv });
		vm.addTableToQuery(vm.schema().table('accounts'));
		expect(vm.sql()).toBe("select t0.`name`\nfrom `accounts` t0");
	});

	it("should build a simple two-table join", () => {
		var vm = new JQB.ViewModel({ schemaCsv: csv });
		vm.addTableToQuery(vm.schema().table('accounts'));
		vm.addTableToQuery(vm.schema().table('users'));
		expect(vm.sql()).toBe(
			"select t0.`name`, t1.`name`\n"
			+ "from `accounts` t0\n"
			+ "join `users` t1 on t1.`account_id` = t0.`id`");
	});

});
