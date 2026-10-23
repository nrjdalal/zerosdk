# Settings are one typed object, stored a row per setting

The choices that hold for the whole factory are one `Settings` object, typed field by field like every other schema, and stored one row per setting (`key`, a JSON `value` and `updatedAt`), so a new setting needs no migration, two agents changing different settings never overwrite each other, and each change is one small event the server pushes to the UI ([research](../research/0005-settings.md)). Nothing is read from a file: a setting is saved from the UI, or by an agent through the `zerosdk` CLI, and takes effect while the factory runs. That is why the record is not a config, the sources' word for files and for code a developer writes, but settings, the word every product with a settings page uses (4 of 4 sources with a UI, 9 of 9 agent apps checked); no product of the 34 read names its record `Setting`, which means one key. There is one layer, the factory: the four sources that layer their settings stack user, project and managed ones, but one person on one machine has no organization and no settings files, and a narrower layer, the agent's own, can come when a setting needs one. A setting nobody changed has no row, and its default applies; every setting has one. Each row keeps when it last changed, as 11 of the 13 products that store settings in rows do, but not who changed it (1 of 34) or a version (1 of 9).

## Considered Options

- **One row with a column per setting:** every new setting needs a migration; 39 of Superset's 60 migrations touch its settings row, against 1 of Emdash's 47 for its key-value table.
- **The whole object in one row:** as OpenCode's app keeps it, two agents saving at once can lose one change.
- **Layers now:** nothing needs a per-repository override yet, and adding a project to each row later leaves every setting as it is.
- **Who changed a setting, on its row:** only Letta's archived server kept it; GitHub and Slack keep it in an audit log, which is where it would go.
