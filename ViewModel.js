var JQB;
(function (JQB) {
    var ViewModel = (function () {
        function ViewModel(options) {
            var _this = this;
            this.schema = ko.observable(null);
            this.queryTables = ko.observableArray([]);
            this.schema(new JQB.Schema.Database(options.schemaCsv));
            this.sql = ko.computed(function () {
                return _this.computeSql();
            });
        }
        ViewModel.prototype.addTableToQuery = function (table) {
            var qt = new QueryTable(this, table);
            this.queryTables.push(qt);
            if (this.queryTables().length > 1) {
                qt.tryToAutoJoin();
            }
        };

        ViewModel.prototype.table = function (name) {
            for (var i = 0, a = this.queryTables(); i < a.length; i++) {
                if (a[i].name() === name) {
                    return a[i];
                }
            }
            return null;
        };

        ViewModel.prototype.computeSql = function () {
            if (this.queryTables().length === 0) {
                return '(nothing selected)';
            }
            var columnLists = [];
            var tableSql = [];

            for (var i = 0, a = this.queryTables(); i < a.length; i++) {
                var table = a[i];
                columnLists = columnLists.concat(table.getColumnSql());
                tableSql.push(table.getSourceSql());
            }

            return 'select ' + columnLists.join(', ') + "\n" + tableSql.join("\n");
        };
        return ViewModel;
    })();
    JQB.ViewModel = ViewModel;

    var QueryTable = (function () {
        function QueryTable(root, table) {
            this.root = root;
            this.table = table;
            this.name = ko.observable('');
            this.joins = ko.observableArray([]);
            this.name(table.name);
            var cols = [];
            for (var i = 0; i < table.columns.length; i++) {
                cols.push(new QueryColumn(table.columns[i]));
            }
            this.columns = ko.observableArray(cols);
        }
        QueryTable.prototype.column = function (name) {
            for (var i = 0, a = this.columns(); i < a.length; i++) {
                if (a[i].name() === name)
                    return a[i];
            }
            return null;
        };

        QueryTable.prototype.tryToAutoJoin = function () {
            var otherTables = [];
            for (var i = 0, a = this.root.queryTables(); i < a.length; i++) {
                if (this === a[i])
                    break;
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
                    this.joins.push(new JoinCondition(primary, fkTable, primaryColumn, fkColumn));
                }
            }
        };

        QueryTable.prototype.getColumnSql = function () {
            var cols = [];
            for (var i = 0, a = this.columns(); i < a.length; i++) {
                var col = a[i];
                if (!col.view())
                    continue;
                cols.push(this.alias() + '.`' + col.name() + '`');
            }
            return cols;
        };

        QueryTable.prototype.getSourceSql = function () {
            if (this.isRoot()) {
                return "from `" + this.name() + "` " + this.alias();
            }
            var sql = "join `" + this.name() + "` " + this.alias() + " on ";
            var joinClauses = [];
            for (var i = 0, a = this.joins(); i < a.length; i++) {
                var j = a[i];
                joinClauses.push(j.joinTable.alias() + '.`' + j.joinColumn.name() + '` = ' + j.primary.alias() + '.`' + j.primaryColumn.name() + '`');
            }
            if (joinClauses.length === 0) {
                joinClauses.push('(NEED JOIN DEFINITION)');
            }
            return sql + joinClauses.join(' and ');
        };

        QueryTable.prototype.isRoot = function () {
            return this.root.queryTables.indexOf(this) === 0;
        };

        QueryTable.prototype.alias = function () {
            return 't' + this.root.queryTables.indexOf(this);
        };
        return QueryTable;
    })();
    JQB.QueryTable = QueryTable;

    var QueryColumn = (function () {
        function QueryColumn(column) {
            this.column = column;
            this.name = ko.observable(column.name);
            this.view = ko.observable(!column.isPkOrFk());
        }
        return QueryColumn;
    })();
    JQB.QueryColumn = QueryColumn;

    var JoinCondition = (function () {
        function JoinCondition(primary, joinTable, primaryColumn, joinColumn) {
            this.primary = primary;
            this.joinTable = joinTable;
            this.primaryColumn = primaryColumn;
            this.joinColumn = joinColumn;
        }
        return JoinCondition;
    })();
    JQB.JoinCondition = JoinCondition;
})(JQB || (JQB = {}));
