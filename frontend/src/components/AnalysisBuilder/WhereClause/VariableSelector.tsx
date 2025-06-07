import React, { useState, useEffect } from 'react'
import { Select, Input, AutoComplete } from 'antd'
import { DatabaseOutlined, TableOutlined } from '@ant-design/icons'

const { Option } = Select

interface VariableSelectorProps {
  type: 'dataset' | 'variable'
  value: string
  onChange: (value: string) => void
  datasets?: string[]
  dataset?: string // Current dataset for variable selection
  placeholder?: string
}

// Common CDISC dataset names
const commonDatasets = [
  'ADSL', 'ADAE', 'ADTTE', 'ADEFF', 'ADLB', 'ADCM', 'ADVS', 'ADEG', 'ADPC', 'ADPP',
  'DM', 'AE', 'CM', 'VS', 'LB', 'EG', 'PE', 'IE', 'DS', 'EX', 'MH', 'SU', 'FA', 'QS'
]

// Common variable names by dataset
const commonVariables: Record<string, string[]> = {
  'ADSL': [
    'USUBJID', 'SUBJID', 'SITEID', 'AGE', 'AGEGR1', 'AGEGR1N', 'SEX', 'RACE', 'ETHNIC',
    'TRT01P', 'TRT01PN', 'TRT01A', 'TRT01AN', 'TRTSDT', 'TRTEDT', 'SAFFL', 'ITTFL', 'EFFFL',
    'COMP8FL', 'COMP16FL', 'COMP24FL', 'DCSREAS', 'DCDECOD', 'RANDDT', 'DTHFL', 'DTHDTC'
  ],
  'ADAE': [
    'USUBJID', 'AESEQ', 'AEDECOD', 'AEBODSYS', 'AESOC', 'AEHLGT', 'AEHLT', 'AELLT',
    'AESEV', 'AESER', 'AEREL', 'AEACN', 'AEOUT', 'AESTDT', 'AEENDT', 'ASTDT', 'AENDT',
    'TRTEMFL', 'ANL01FL', 'CQ01NAM', 'SMQ01NAM', 'AECONTRT', 'AESDTH', 'AESLIFE', 'AESHOSP'
  ],
  'ADTTE': [
    'USUBJID', 'PARAM', 'PARAMCD', 'PARAMN', 'AVAL', 'AVALU', 'CNSR', 'STARTDT', 'ADT',
    'EVNTDESC', 'SRCDOM', 'SRCVAR', 'SRCSEQ', 'CNSDTDSC', 'CNSDTDSC'
  ],
  'DM': [
    'USUBJID', 'SUBJID', 'RFSTDTC', 'RFENDTC', 'RFXSTDTC', 'RFXENDTC', 'RFICDTC', 'RFPENDTC',
    'DTHDTC', 'DTHFL', 'SITEID', 'BRTHDTC', 'AGE', 'AGEU', 'SEX', 'RACE', 'ETHNIC', 
    'ARMCD', 'ARM', 'ACTARMCD', 'ACTARM', 'COUNTRY', 'DMDTC', 'DMDY'
  ],
  'AE': [
    'USUBJID', 'AESEQ', 'AESPID', 'AETERM', 'AEDECOD', 'AEBODSYS', 'AESOC', 'AEHLGT',
    'AEHLT', 'AELLT', 'AESEV', 'AESER', 'AEACN', 'AEREL', 'AEOUT', 'AESCAN', 'AESCONG',
    'AESDISAB', 'AESDTH', 'AESHOSP', 'AESLIFE', 'AESMIE', 'AECONTRT', 'AESTDTC', 'AEENDTC'
  ],
  'VS': [
    'USUBJID', 'VSSEQ', 'VSTESTCD', 'VSTEST', 'VSCAT', 'VSSCAT', 'VSPOS', 'VSORRES',
    'VSORRESU', 'VSSTRESC', 'VSSTRESN', 'VSSTRESU', 'VSSTAT', 'VSREASND', 'VSNAM',
    'VSSPEC', 'VSLOC', 'VSLAT', 'VSDIR', 'VSMETHOD', 'VSBLFL', 'VSDRVFL', 'VSDTC', 'VSDY'
  ],
  'LB': [
    'USUBJID', 'LBSEQ', 'LBTESTCD', 'LBTEST', 'LBCAT', 'LBSCAT', 'LBORRES', 'LBORRESU',
    'LBORNRLO', 'LBORNRHI', 'LBSTRESC', 'LBSTRESN', 'LBSTRESU', 'LBSTNRLO', 'LBSTNRHI',
    'LBNRIND', 'LBSTAT', 'LBREASND', 'LBNAM', 'LBSPEC', 'LBMETHOD', 'LBBLFL', 'LBDRVFL',
    'LBDTC', 'LBDY', 'LBTM'
  ]
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  type,
  value,
  onChange,
  datasets = [],
  dataset,
  placeholder = 'Select or enter value'
}) => {
  const [searchValue, setSearchValue] = useState(value)
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])

  useEffect(() => {
    setSearchValue(value)
  }, [value])

  useEffect(() => {
    if (type === 'dataset') {
      // Combine provided datasets with common datasets
      const allDatasets = Array.from(new Set([...datasets, ...commonDatasets]))
      setFilteredOptions(allDatasets)
    } else if (type === 'variable' && dataset) {
      // Get common variables for the selected dataset
      const variables = commonVariables[dataset.toUpperCase()] || []
      setFilteredOptions(variables)
    } else {
      setFilteredOptions([])
    }
  }, [type, datasets, dataset])

  const handleSearch = (searchText: string) => {
    setSearchValue(searchText)
    
    if (type === 'dataset') {
      const allDatasets = Array.from(new Set([...datasets, ...commonDatasets]))
      const filtered = allDatasets.filter(ds => 
        ds.toLowerCase().includes(searchText.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else if (type === 'variable' && dataset) {
      const variables = commonVariables[dataset.toUpperCase()] || []
      const filtered = variables.filter(variable =>
        variable.toLowerCase().includes(searchText.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }

  const handleSelect = (selectedValue: string) => {
    setSearchValue(selectedValue)
    onChange(selectedValue)
  }

  const handleChange = (newValue: string) => {
    setSearchValue(newValue)
    onChange(newValue)
  }

  const options = filteredOptions.map(option => ({
    value: option,
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {type === 'dataset' ? (
          <DatabaseOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        ) : (
          <TableOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
        )}
        <span>{option}</span>
        {type === 'dataset' && commonDatasets.includes(option) && (
          <span style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
            CDISC Standard
          </span>
        )}
      </div>
    )
  }))

  return (
    <AutoComplete
      value={searchValue}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ width: '100%' }}
      filterOption={false}
      notFoundContent={
        type === 'variable' && !dataset 
          ? 'Select a dataset first'
          : filteredOptions.length === 0 
            ? 'No suggestions available'
            : null
      }
    />
  )
}

export default VariableSelector