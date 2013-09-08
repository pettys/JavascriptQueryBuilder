
/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="Schema.ts" />

module JQB {

	export interface IOptions {
		schemaCsv: string;
	}

	export class ViewModel {

		public schema: KnockoutObservable<JQB.Schema.Database> = ko.observable(null);
		public queryTables: KnockoutObservableArray<QueryTable> = ko.observableArray([]);
		public sql: KnockoutComputed<string>;

		constructor(options: IOptions) {
			this.schema(new JQB.Schema.Database(options.schemaCsv));
			this.sql = ko.computed(() => this.computeSql());
		}

		public queryTable(name: string): QueryTable {
			for (var i = 0, a = this.queryTables(); i < a.length; i++){
				if (a[i].name() === name) return a[i];
			}
			return null;
		}

		public addTableToQuery(table: JQB.Schema.Table) {
			var qt = new QueryTable(this, table);
			this.queryTables.push(qt);
			if (this.queryTables().length > 1) {
				qt.tryToAutoJoin();
			}
		}

		public table(name: string): QueryTable {
			for (var i = 0, a=this.queryTables(); i < a.length; i++) {
				if (a[i].name() === name) {
					return a[i];
				}
			}
			return null;
		}

		public computeSql() {
			if (this.queryTables().length === 0) {
				return '(nothing selected)';
			}
			var columnLists: Array<string> = [];
			var tableSql: Array<string> = [];

			for (var i = 0, a = this.queryTables(); i < a.length; i++) {
				var table = a[i];
				columnLists = columnLists.concat(table.getColumnSql());
				tableSql.push(table.getSourceSql());
			}

			return 'select ' + columnLists.join(', ') + "\n" + tableSql.join("\n");
		}

	}

	export class QueryTable {

		public name = ko.observable('');
		public columns: KnockoutObservableArray<QueryColumn>;

		constructor(private root: ViewModel, private table: JQB.Schema.Table) {
			this.name(table.name);
			var cols = [];
			for (var i = 0; i < table.columns.length; i++) {
				cols.push(new QueryColumn(table.columns[i]));
			}
			this.columns = ko.observableArray(cols);
		}

		public column(name: string): QueryColumn {
			for (var i = 0, a = this.columns(); i < a.length; i++) {
				if (a[i].name() === name) return a[i];
			}
			return null;
		}

		public tryToAutoJoin() {
			var otherTables: Array<JQB.Schema.Table> = [];
			for (var i = 0, a = this.root.queryTables(); i < a.length; i++) {
				if (this === a[i]) break; // only check tables to the left of this table.
				otherTables.push(a[i].table);
			}
			var fks = this.table.guessForeignKeys(otherTables);
			if (fks.length === 0) {
				return;
			}
			for (var i = 0; i < fks.length; i++) {
				var fk = fks[i];
				var primary = this.root.table(fk.primary.name);
				var fkTable = this.root.table(fk.fkOwner.name);
				for (var j = 0; j < fk.primaryColumns.length; j++) {
					var primaryColumn = primary.column(fk.primaryColumns[j].name);
					var fkColumn = fkTable.column(fk.fkColumns[j].name);
					fkColumn.joins.push(new JoinCondition(primary, primaryColumn));
				}
			}
		}

		public getColumnSql() {
			var cols = [];
			for (var i = 0, a = this.columns(); i < a.length; i++) {
				var col = a[i];
				if (!col.view()) continue;
				cols.push(this.alias() + '.`' + col.name() + '`');
			}
			return cols;
		}

		public getSourceSql() {
			if (this.isRoot()) {
				return "from `" + this.name() + "` " + this.alias();
			}
			var sql = "join `" + this.name() + "` " + this.alias() + " on ";
			var joinClauses = [];
			for (var i = 0, cols = this.columns(); i < cols.length; i++) {
				for (var j = 0, joins = cols[i].joins(); j < joins.length; j++) {
					var join = joins[j];
					var joinClause = this.alias() + '.`' + cols[i].name()
						+ '` = ' + join.primary.alias() + '.`' + join.primaryColumn.name() + '`';
					joinClauses.push(joinClause);
				}
			}
			if (joinClauses.length === 0) {
				joinClauses.push('(NEED JOIN DEFINITION)');
			}
			return sql + joinClauses.join(' and ');
		}

		private isRoot(): boolean {
			return this.root.queryTables.indexOf(this) === 0;
		}

		private alias(): string {
			return 't' + this.root.queryTables.indexOf(this);
		}

	}

	export class QueryColumn {

		public name: KnockoutObservable<string>;
		public view: KnockoutObservable<boolean>;
		public joins: KnockoutObservableArray<JoinCondition> = ko.observableArray([]);

		constructor(public column: JQB.Schema.Column) {
			this.name = ko.observable(column.name);
			this.view = ko.observable(!column.isPkOrFk());
		}

	}

	export class JoinCondition {

		constructor(public primary: QueryTable, public primaryColumn: QueryColumn) {
		}

	}

}