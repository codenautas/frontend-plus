import * as React from "react";
import * as ReactDOM from "react-dom";
import {
    FocusEvent, 
    useEffect, useState, 
} from "react";

import {
    Alert, AppBar, Autocomplete, 
    Button, 
    Checkbox, CircularProgress,
    FormControl, FormControlLabel,
    IconButton,
    List, ListItemButton, ListItemText, 
    MenuItem, 
    Select, SvgIcon, SwipeableDrawer, 
    TextField, TextFieldVariants, Toolbar, Typography,
} from "@mui/material";

import { myIcons } from "./my-icons";
import { strict as likeAr, beingArray } from "like-ar";
import * as JSON4all from "json4all";
import * as BestGlobals from "best-globals";

////// BACKEND-PLUS partial interfaces 
export interface FieldDefinition {
    name: string
    typeName: 'text'|'decimal'|'boolean'|'date'|'bigint'
    title: string
    nullable: boolean
    allowEmptyText: boolean
    allow: {
        update: boolean
    }
    references: string
    suggestingKeys: string[]
}

export interface TableDefinition {
    fields: FieldDefinition[]
    primaryKey: string[]
}

export type RecordStatus = 'new'|'update' 
export type FixedFields = {fieldName:string, value:any}[]
export interface BEAPI {
    table_structure: (params:{
        table: string
    }) => Promise<TableDefinition>
    table_data: <T extends RowType>(params:{
        table: string, 
        fixedFields: FixedFields, 
        paramfun: {}
    }) => Promise<T[]>
    table_record_save: (params:{
        table: string, 
        primaryKeyValues: any[], 
        newRow: RowType, 
        oldRow: RowType,
        status: RecordStatus
    }) => Promise<{row: RowType}>
    option_lists: (params:{
        table: string
    }) => Promise<OptionsInfo>
}

export interface Connector {
    ajax: BEAPI
}

export interface AddrParams {
    table: string
    ff: Record<string, any> | {fieldName:string, value:any}[]
}

////// END-BACKEND partial interfaces 

export const ICON = likeAr(myIcons).map(svgText=> () =>
    <SvgIcon><path d={svgText}/></SvgIcon>
).plain();

const SEPARATOR_STR = '⸻⸻'

export function MenuH(props:{title:string, rightTitle?:string, mobile:boolean, onMobile:(mobile:boolean)=>void}){
    var [menuOpened, setMenuOpened] = useState(false);
    return <>
        <AppBar position="static">
            <Toolbar>
                <IconButton color="inherit" onClick={()=>setMenuOpened(true)}><ICON.Menu aria-label="menu"/></IconButton>
                <Typography flexGrow={2}>
                    {props.title}
                </Typography>
                <Typography>
                    {props.rightTitle}
                </Typography>
                {props.mobile
                    ? <IconButton color="inherit" onClick={_ => props.onMobile(false)}><ICON.MobileFriendlyRounded/></IconButton>
                    : <IconButton color="inherit" onClick={_ => props.onMobile(true )}><ICON.ComputerRounded/></IconButton>
                }
                <IconButton color="inherit" onClick={()=>{window.location.href="./menu"}}><ICON.ExitToApp/></IconButton>
            </Toolbar>
        </AppBar>
        <SwipeableDrawer  
            open={menuOpened}
            onClose={()=>setMenuOpened(false)}
            onOpen={()=>setMenuOpened(true)}
        >
            <div
                role="presentation"
                onClick={()=>setMenuOpened(false)}
                onKeyDown={()=>setMenuOpened(false)}
            >
                <List>
                    <ListItemButton 
                        onClick={()=>{
                            setMenuOpened(false);
                        }}
                    >
                        <ListItemText primary="administrar" 
                            onClick={()=>{
                                window.location.href="./login"
                            }}
                        />
                    </ListItemButton>
               </List>
            </div>
        </SwipeableDrawer>
    </>
}

export function ifNotNullApply<T,U>(value:T|null,f:((value:T) => U)):U|null{
    return value == null ? null : f(value)
}

export function ComboBox(props:{
    key: string, value: string|null, valueOfNull: string|null, onChange: (newValue:null|string)=>void
    options: string[], label: string, freeSolo: boolean, disabled: boolean, helperText?: string, variant?:TextFieldVariants,
    className?:string, title?:string, mobile:boolean
    // sx?:SxProps<Theme>, inputProps?:InputBaseComponentProps
}){
    var [mobileKeyboardEditing, setMobileKeyboardEditing] = useState(false);
    var {key, value, valueOfNull, onChange, options, label, freeSolo, disabled, variant, className, title,
        mobile
        // sx, inputProps, 
    } = props
    var checkError = (value:string|null) => !freeSolo && !options.includes(value as string);
    return !mobile || mobileKeyboardEditing ? <Autocomplete 
        disablePortal
        key={key}
        value={value ?? ''}
        onChange={(_event: any, newValue: any) => {
            var isNull = newValue != null && newValue !== ''
            const value = isNull ? newValue : valueOfNull;
            onChange(value);
            // if (!isNull) setMobileKeyboardEditing(false)
        }}
        onBlur={(event: FocusEvent<any>) => {
            const newValue = event.target.value
            var isNull = newValue != null && newValue !== ''
            const value = isNull ? newValue : valueOfNull;
            onChange(value);
            // if (!isNull) setMobileKeyboardEditing(false)
        }}
        options={options}
        renderInput={(params) => <TextField {...params}
            required={true} 
            error={checkError(value)} 
            label={label} 
            InputLabelProps={{shrink: value != null}}
            variant={variant}
            className={className}
        />}
        getOptionDisabled={value => value == SEPARATOR_STR}
        freeSolo={freeSolo}
        autoSelect={true}
        disabled={disabled}
        title={title}
    /> : <Select
        key={key}
        value={value ?? ''}
        onChange={(event: any, _selectedItem: any) => {
            const newValue = event.target.value;
            const value = newValue != null && newValue !== '' ? newValue : valueOfNull;
            if (value == null || value === "") setMobileKeyboardEditing(true)
            else onChange(value);
        }}
        label={label} 
        variant={variant}
        className={className}
        required={true} 
        error={checkError(value)} 
        disabled={disabled}
        title={title}
    >
        <MenuItem key={"$ keyboard $$$$!"} value={""}><ICON.KeyboardHideRounded/></MenuItem>
        {options.map((o,i)=> <MenuItem key={o+"$$$$$"+i} value={o} disabled={o == SEPARATOR_STR}>{o}</MenuItem>)}
    </Select>
}

export type FieldTypes = null|string|boolean|number|BestGlobals.RealDate
export type RowType = Record<string, FieldTypes>

export function VerticalCardEditor(props:{updatesToRow:RowType, originalRow:RowType, onRowChange: (row:RowType)=>void, tableDef:TableDefinition, lists:(name:string, row:RowType)=>string[], forEdit:boolean,
    mobile:boolean
}){
    const {updatesToRow, originalRow, tableDef, lists, mobile} = props;
    const fieldsDef = tableDef.fields; 
    const variant:TextFieldVariants = "standard";
    const newRow = {...originalRow, ...updatesToRow};
    console.log('**************')
    console.log(JSON.stringify(newRow))
    return <>
        {fieldsDef.map((fd) => { 
            const {name, typeName, title, allow} = fd;
            const editable = !!allow?.update && props.forEdit;
            const key = "renglon-" + name;
            const makeChange = (newValue: any) => {
                var newUpdatesToRow = {...updatesToRow}
                if (BestGlobals.sameValue(newValue, originalRow[name] ?? null)){
                    delete newUpdatesToRow[name];
                } else {
                    newUpdatesToRow[name] = newValue;
                }
                props.onRowChange(newUpdatesToRow);
            }
            const isValueUpdated = name in updatesToRow;
            const value = (isValueUpdated ? updatesToRow[name] : originalRow[name]) ?? null;
            const originalValue = originalRow[name] ?? null;
            const toolTip = isValueUpdated ? 'ANTES: ' + originalValue : '';
            const classUpdated = isValueUpdated ? "bp-field-changed" : "bp-field-unchanged"
            switch(typeName){
                case 'boolean':
                    return <FormControlLabel control={
                        <Checkbox 
                            key={key} 
                            checked={!!value}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                makeChange(event.target.checked);
                            }}
                            disabled={!editable}
                            name={title} 
                        />
                    } label={name}
                    className={classUpdated}
                    />;
                case 'date':
                    return <TextField 
                        key={key} 
                        value={value == null ? '' : (value as BestGlobals.RealDate)?.toYmd?.()}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            makeChange(ifNotNullApply(event.target.value, BestGlobals.date.iso));
                        }}
                        type="date" 
                        InputLabelProps={{ shrink: true }} 
                        label={title} 
                        disabled={!editable}
                        title={toolTip}
                        variant={variant} 
                        className={classUpdated}
                    />
                case 'decimal':
                case 'bigint':
                    return <TextField 
                        key={key} 
                        // value={ifNotNullApply(value, Number)}
                        value={value == null ? '' : value}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            makeChange(ifNotNullApply(event.target.value, Number));
                        }}
                        type="number" 
                        InputLabelProps={{ shrink: value != null }} 
                        label={title} 
                        disabled={!editable}
                        title={toolTip}
                        variant={variant} 
                        className={classUpdated}
                    />
                default: 
                    const options = lists(name, newRow) ?? [];
                    // @ts-expect-error value can be not string
                    if (value != null && !options.includes(value)) { options.unshift(value) }
                    return <ComboBox 
                        key={key}
                        value={value as string}
                        onChange={(value: string|null) => {
                            makeChange(value);
                        }}
                        valueOfNull={!fd.nullable && fd.allowEmptyText ? '' : null}
                        options={options}
                        label={title!}
                        disabled={!editable}
                        freeSolo={!fd.references}
                        variant={variant}
                        title={toolTip}
                        className={classUpdated}
                        mobile={mobile}
                    />
            }
        })}
    </>
}

export type OptionsInfo = {chained?: RowType, relations?:Record<string, string[]>, tables?:Record<string, Record<string, RowType>>}

export type GenericFieldProperties = {
    fd:FieldDefinition, value:any, forEdit:boolean, originalValue:any, isValueUpdated:boolean,
    mobile:boolean, makeChange:(value:any)=>void, getOptions:()=>any[]
}

export function GenericField(props:GenericFieldProperties){
    const variant = "standard";
    var {fd, value, originalValue, isValueUpdated, mobile, makeChange} = props;
    const {name, typeName, title, allow} = fd;
    const editable = !!allow?.update && props.forEdit;
    const key = "renglon-" + name;
    const toolTip = isValueUpdated ? 'ANTES: ' + originalValue : '';
    const classUpdated = isValueUpdated ? "bp-field-changed" : "bp-field-unchanged"
    switch (typeName) {
        case 'boolean':
            return <FormControlLabel control={
                <Checkbox 
                    key={key} 
                    checked={!!value}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        makeChange(event.target.checked);
                    }}
                    disabled={!editable}
                    name={name} 
                />
            } label={title}
            className={`fp-fieldname-${name} ${classUpdated}`}
            />;
        case 'date':
            return <TextField 
                key={key} 
                className={`fp-fieldname-${name} ${classUpdated}`}
                value={value == null ? '' : (value as BestGlobals.RealDate)?.toYmd?.()}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    makeChange(ifNotNullApply(event.target.value, BestGlobals.date.iso));
                }}
                type="date" 
                InputLabelProps={{ shrink: true }} 
                label={title} 
                disabled={!editable}
                title={toolTip}
                variant={variant} 
            />
        case 'decimal':
        case 'bigint':
            return <TextField 
                key={key} 
                className={`fp-fieldname-${name} ${classUpdated}`}
                value={value == null ? '' : value}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    makeChange(ifNotNullApply(event.target.value, Number));
                }}
                type="number" 
                InputLabelProps={{ shrink: value != null }} 
                label={title} 
                disabled={!editable}
                title={toolTip}
                variant={variant} 
            />
        default: 
            if (typeName == 'text' && editable) {
                const options = props.getOptions()
                if (value != null && !options.includes(value)) { options.unshift(value) }
                return <ComboBox 
                    key={key}
                    className={`fp-fieldname-${name} ${classUpdated}`}
                    value={value as string}
                    onChange={(value: string|null) => {
                        makeChange(value);
                    }}
                    valueOfNull={!fd.nullable && fd.allowEmptyText ? '' : null}
                    options={options}
                    label={title!}
                    disabled={!editable}
                    freeSolo={!fd.references}
                    variant={variant}
                    title={toolTip}
                    mobile={mobile}
                />
            } else {
                return <TextField 
                    key={key}
                    className={`fp-fieldname-${name} ${classUpdated}`}
                    value={value as string}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        makeChange(ifNotNullApply(event.target.value, Number));
                    }}
                    label={title!}
                    disabled={!editable}
                    variant={variant}
                    title={toolTip}
                />
            }
    }
}

export function CardVerticalDisplay(props:{fieldsProps:GenericFieldProperties[]}){
    const {fieldsProps} = props;
    return <>
        {fieldsProps.map(props =>
            <GenericField {...props}/>
        )}
    </>
}

export function CardEditorConnected(props:{
    table:string, fixedFields:FixedFields, conn:Connector,
    CardDisplay:(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}) => JSX.Element
}){
    const {table, fixedFields, conn, CardDisplay} = props;
    const fakeTableDef = {
        name: table,
        fields:[
        ] satisfies FieldDefinition[],
        primaryKey:[]
    }
    const [tableDef, setTableDef] = useState<TableDefinition>(fakeTableDef);
    const [updatesToRow, setUpdatesToRow] = useState<RowType>({});
    const [rows, setRows] = useState<RowType[]>([]);
    const [originalRow, setOriginalRow] = useState<RowType>({});
    const [optionsInfo, setOptionsInfo] = useState<OptionsInfo>({chained: {}, relations: {}, tables:{}});    
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<Error|null>(null);
    const [saving, setSaving] = useState(false);
    const [primaryKeyValues, setPrimaryKeyValues] = useState<any[]>([])
    const [message, setMessage] = useState("");
    const [position, setPosition] = useState<number|null>(1);
    const [count, setCount] = useState(0);
    const [status, setStatus] = useState<RecordStatus>('update');
    const [mobile, setMobile] = useState(window.navigator.maxTouchPoints > 2);
    const [changeCount, setChangeCount] = useState(0);
    const getPrimaryKeyValues = (tableDef:TableDefinition, row:RowType) => tableDef.primaryKey.map(fn => row[fn]);
    const setRowsAndPosition = (tableDef:TableDefinition, rows:RowType[], position:number|null, status:'new'|'update')=>{
        setDirty(false);
        setSaving(false);
        setCount(rows.length);
        if (rows.length == 0) {
            status = 'new';
        }
        const pos = status == 'new' ? rows.length + 1 : position == null ? 1 : position > rows.length ? rows.length : position < 1 ? 1 : position;
        setPosition(pos);
        const row = status == 'new' ? beingArray(tableDef.fields).build(fd => ({[fd.name]:null})).plain() : rows[pos - 1];
        if (status == 'new') {
            setRows([...rows, row]);
        } else {
            setRows(rows);
        }
        setPrimaryKeyValues(getPrimaryKeyValues(tableDef, row));
        setUpdatesToRow({});
        setOriginalRow(row);
        setStatus(status)
    }
    useEffect(() => {
        setTableDef(fakeTableDef)
        setUpdatesToRow({});
        setOriginalRow({});
        var firstPromise = conn.ajax.table_structure({table}).then(tableDef=>{setTableDef(tableDef); return tableDef})
        Promise.all([
            firstPromise,
            conn.ajax.table_data({table, fixedFields, paramfun:{}}).then(function(rows){
                return firstPromise.then((tableDef:TableDefinition)=>{
                    setRowsAndPosition(tableDef, rows, 0, 'update')
                })
            }),
            conn.ajax.option_lists({table}).then(setOptionsInfo),
        ]).catch(setError);
        return () => {
            console.log('saliendo de la ficha')
        };
    }, [table, JSON.stringify(fixedFields)]);
    useEffect(()=>{
        if (saving) {
            setSaving(false);
            conn.ajax.table_record_save({
                table,
                primaryKeyValues,
                newRow:updatesToRow,
                oldRow:originalRow,
                status
            }).then((result)=>{
                var newRow = result.row;
                var newRows = rows.map(r => r == originalRow ? newRow : r);
                setRowsAndPosition(tableDef, newRows, position, 'update')
            }).catch(function(err){
                setMessage(err.message);
            });
        }
    }, [saving])
    console.log("===============");
    console.log(JSON.stringify(updatesToRow))
    const lists = (name:string, row:RowType) => {
        var info = optionsInfo?.chained?.[name] ?? [];
        // @ts-expect-error
        var fieldDef:FieldDefinition = tableDef.field[name]!
        for (var key of fieldDef.suggestingKeys ?? []) {
            // @ts-expect-error
            info = info[row[key]] ?? []
        }
        var result: string[] = [
            ...(info instanceof Array && info.length ? info : []),
            ...(info instanceof Array && info.length && optionsInfo?.relations?.[name] ? [SEPARATOR_STR] : []),
            ...(optionsInfo?.relations?.[name] ? optionsInfo?.relations[name] : [])
        ]
        console.log("------------", name);
        console.log(JSON.stringify(row));
        console.log(JSON.stringify(info));
        console.log(JSON.stringify(result));
        return result;
    }
    return <>
        <MenuH title="Renglón" rightTitle={(changeCount || '').toString()} mobile={mobile} onMobile={setMobile}/>
        <div style={{display: error == null ? "none" : "unset"}}>
            <Alert icon={<ICON.ErrorOutlineRounded/>} severity="error">
            {error?.message}
            </Alert>
        </div>
        <FormControl
            component="form"
            sx={{
                '& > :not(style)': { m: 1, width: '5ch' },
            }}
            noValidate
            autoComplete="off"
        >
            <Button disabled = { dirty || status == 'new' || count <= 1} onClick={_ =>{ setRowsAndPosition(tableDef, rows, position && position - 1, 'update')} }><ICON.KeyboardArrowUp/></Button>
            <Typography>{position == null ? 'NO' : position + '/' + count }</Typography>
            <Button disabled = { dirty || status == 'new' || count <= 1} onClick={_ =>{ setRowsAndPosition(tableDef, rows, position && position + 1, 'update')} }><ICON.KeyboardArrowDown/></Button>
            <Button disabled = { dirty || status == 'new' } title={"Agregar"} onClick={_ =>{ setRowsAndPosition(tableDef, rows, null, 'new')} }><ICON.AddCircleOutlineRounded/></Button>
        </FormControl>
        <FormControl
            key={JSON4all.toUrl(primaryKeyValues)}
            component="form"
            sx={{
                '& > :not(style)': { m: 1, width: '25ch' },
            }}
            noValidate
            autoComplete="off"
        >
            {(()=>{
                const onRowChange=function(row:RowType){
                    setChangeCount(x => x+1)
                    var dirty = false;
                    for (var _ in row) {
                        dirty = true;
                        break;
                    }
                    setDirty(dirty);
                    setUpdatesToRow(row);
                }
                const forEdit = !saving;
                const fieldsDef = tableDef.fields; 
                const newRow = {...originalRow, ...updatesToRow};
                console.log('=============')
                console.log(JSON.stringify(newRow))
                var fieldsProps = fieldsDef.map((fd) => { 
                    var {name} = fd;
                    const makeChange = (newValue: any) => {
                        var newUpdatesToRow = {...updatesToRow}
                        if (BestGlobals.sameValue(newValue, originalRow[name] ?? null)){
                            delete newUpdatesToRow[name];
                        } else {
                            newUpdatesToRow[name] = newValue;
                        }
                        onRowChange(newUpdatesToRow);
                    }
                    const isValueUpdated = name in updatesToRow;
                    const value = (isValueUpdated ? updatesToRow[name] : originalRow[name]) ?? null;
                    const originalValue = originalRow[name] ?? null;
                    return {fd, value, forEdit, originalValue, isValueUpdated, mobile, makeChange, getOptions:()=>lists(name, newRow) ?? []}
                });
                return <CardDisplay fieldsProps={fieldsProps} optionsInfo={optionsInfo}/>
            })()}
            <Button 
                key={"$ button save"}
                startIcon={saving ? <CircularProgress size={20} /> : <ICON.Save/>} 
                disabled={!dirty || saving}
                onClick={()=>{
                    setSaving(true);
                }}
            >
                {saving ? 'Guardando' : dirty ? 'Guardar' : 'Guardado'}
            </Button>
        </FormControl>
        <Typography>{message}</Typography>
    </>
}

class CaptureError extends React.Component<
    {children:any},
    {hasError:boolean, error:Error|{message:string}, info?:any}
>{
    constructor(props:{children:any}) {
        super(props);
        this.state = { hasError: false, error:{message:''} };
    }
    override componentDidCatch(error:Error, info:any){
        this.setState({ hasError: true , error, info });
    }
    override render(){
        if(this.state.hasError){
            return <>
                <Typography>Hubo un problema en la programación del dipositivo móvil.</Typography>
                <Typography>Error detectado:</Typography>
                <Typography>{this.state.error.message}</Typography>
                <Typography>{JSON.stringify(this.state.info)}</Typography>
            </>;
        }
        return this.props.children;
    }
}

export function renderConnectedApp(
    conn:Connector,
    addrParams:AddrParams,
    layout: HTMLElement,
    ConnectedApp: (props:{table: string, fixedFields:FixedFields, conn:Connector}) => JSX.Element
){
    layout.innerHTML="";
    if (addrParams.ff instanceof Array) {
        var fixedFields:FixedFields = addrParams.ff;
    } else {
        var fixedFields:FixedFields = likeAr(addrParams.ff).map(function(value, key){ return {fieldName:key, value:value}; }).array();
    }
    if (!conn.ajax.option_lists) {
        throw new Error("falta conn.ajax.option_lists en renderCardEditor");
    }
    ReactDOM.render(
        <CaptureError>
            <ConnectedApp table={addrParams.table} fixedFields={fixedFields} conn={conn}/>
        </CaptureError>,
        document.getElementById('total-layout')
    )
}

export function renderCardEditor(
    conn:Connector,
    addrParams:AddrParams,
    layout: HTMLElement
){
    renderConnectedApp(conn, addrParams, layout, 
        ({table, fixedFields, conn}) => CardEditorConnected({table, fixedFields, conn, CardDisplay:CardVerticalDisplay})
    )
}

export function renderCardEditorLegacy(
    conn:Connector,
    addrParams:AddrParams,
    layout: HTMLElement
){
    layout.innerHTML="";
    if (addrParams.ff instanceof Array) {
        var fixedFields:any = addrParams.ff;
    } else {
        var fixedFields:any = likeAr(addrParams.ff).map(function(value, key){ return {fieldName:key, value:value}; }).array();
    }
    if (!conn.ajax.option_lists) {
        throw new Error("falta conn.ajax.option_lists en renderCardEditor");
    }
    ReactDOM.render(
        <CaptureError>
            <CardEditorConnected table={addrParams.table} fixedFields={fixedFields} conn={conn} CardDisplay={CardVerticalDisplay}/>
        </CaptureError>,
        document.getElementById('total-layout')
    )
}


