

module JQB.Schema {

	export class Database {

		public tables: Array<Table> = [];

		// schemaCsv can be generated in MySQL with:
		//    SELECT c.table_name, c.column_name, c.data_type, c.column_key
		//    FROM information_schema.tables t
		//    JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
		//    WHERE t.table_schema = 'YOUR_DB_NAME'
		//    ORDER BY t.table_name, c.ordinal_position;
		constructor(schemaCsv: string) {
			this.parseSchemaCsv(schemaCsv);
		}

		// Get table by name
		public table(name: string): Table {
			for (var i = 0; i < this.tables.length; i++) {
				if (this.tables[i].name === name) {
					return this.tables[i];
				}
			}
			return null;
		}

		private parseSchemaCsv(schemaCsv: string) {
			var lines = schemaCsv.split("\n");
			var table: Table = null;
			for (var i = 0, len = lines.length; i < len; i++) {
				var vals = lines[i].split(',');
				if (table === null || table.name != vals[0]) {
					table = new Table(vals[0]);
					this.tables.push(table);
				}
				var isPk = vals[3] != null && vals[3].toLowerCase()[0] == 'p';
				table.addColumn(new Column(vals[1], vals[2], isPk));
			}
		}

	}

	export class Table {

		public columns: Array<Column> = [];

		constructor(public name: string) { }

		public singularize(): string {
			if (this.name.match(/ies$/)) {
				return this.name.substr(0, this.name.length - 3) + 'y';
			}
			if (this.name.match(/s$/)) {
				return this.name.substr(0, this.name.length - 1);
			}
			return this.name;
		}

		public addColumn(column: Column) {
			this.columns.push(column);
		}

		public guessForeignKeys(candidates: Array<Table>): Array<ForeignKey> {
			var joins = [];
			for (var i = 0; i < candidates.length; i++) {
				joins = joins.concat(this.guessMyForeignKeysTo(candidates[i]));
				joins = joins.concat(candidates[i].guessMyForeignKeysTo(this));
			}
			return joins;
		}

		public guessMyForeignKeysTo(primary: Table) : Array<ForeignKey> {
			var primaryPk = primary.getPrimaryKey();
			for (var i = 0; i < this.columns.length; i++) {
				var col = this.columns[i];
				if (col.name === primary.name + '_id' || col.name === primary.singularize() + '_id') {
					return [new ForeignKey(primary, this, [primaryPk], [col])];
				}
			}
			return [];
		}

		private getPrimaryKey(): Column {
			if (this.columns.length === 0) return null;
			for (var i = 0; i < this.columns.length; i++) {
				if (this.columns[i].isPk) {
					return this.columns[i];
				}
			}
			return this.columns[0];
		}

	}

	export class ForeignKey {

		constructor(
			public primary: Table,
			public fkOwner: Table,
			public primaryColumns: Array<Column>,
			public fkColumns: Array<Column>) {}

	}

	export class Column {

		constructor(public name: string, public datatype: string, public isPk: boolean) {
		}

		public isPkOrFk() {
			return this.isPk
				|| this.name === 'id'
				|| this.name.match(/_id/);
		}

	}

}
