import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Radio,
  FormControlLabel,
  RadioGroup,
  FormControl,
  FormLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Description as YamlIcon,
  DataObject as JsonIcon,
  TableChart as ExcelIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Visibility as ReadabilityIcon,
  DataUsage as SizeIcon
} from '@mui/icons-material';

interface FormatSelectorProps {
  selectedFormat: string;
  onFormatSelect: (format: string) => void;
  operation: 'import' | 'export';
}

interface FormatOption {
  format: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  extensions: string[];
  pros: string[];
  cons: string[];
  bestFor: string[];
  characteristics: {
    readability: number; // 1-5
    fileSize: number; // 1-5 (smaller is better)
    processingSpeed: number; // 1-5
  };
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatSelect,
  operation
}) => {
  const formatOptions: FormatOption[] = [
    {
      format: 'yaml',
      name: 'YAML',
      icon: <YamlIcon sx={{ fontSize: 40 }} />,
      description: 'Human-readable data serialization standard',
      extensions: ['.yml', '.yaml'],
      pros: [
        'Highly readable and editable',
        'Comments and documentation support',
        'Less verbose than JSON/XML',
        'Good for configuration files'
      ],
      cons: [
        'Indentation sensitive',
        'Slower parsing than JSON',
        'Not as widely supported'
      ],
      bestFor: [
        'Manual editing',
        'Configuration management',
        'Documentation purposes',
        'Complex nested structures'
      ],
      characteristics: {
        readability: 5,
        fileSize: 3,
        processingSpeed: 3
      }
    },
    {
      format: 'json',
      name: 'JSON',
      icon: <JsonIcon sx={{ fontSize: 40 }} />,
      description: 'Lightweight data interchange format',
      extensions: ['.json'],
      pros: [
        'Fast parsing and processing',
        'Widely supported',
        'Compact format',
        'Native JavaScript support'
      ],
      cons: [
        'No comments support',
        'Less human-readable',
        'Strict syntax requirements'
      ],
      bestFor: [
        'API data exchange',
        'Large datasets',
        'Automated processing',
        'Web applications'
      ],
      characteristics: {
        readability: 3,
        fileSize: 4,
        processingSpeed: 5
      }
    },
    {
      format: 'excel',
      name: 'Excel',
      icon: <ExcelIcon sx={{ fontSize: 40 }} />,
      description: 'Spreadsheet format with multiple sheets',
      extensions: ['.xlsx', '.xls'],
      pros: [
        'Familiar interface for users',
        'Multiple sheets support',
        'Built-in data validation',
        'Rich formatting options'
      ],
      cons: [
        'Larger file sizes',
        'Requires special handling',
        'Version compatibility issues'
      ],
      bestFor: [
        'Business users',
        'Data analysis',
        'Reporting and presentation',
        'Complex tabular data'
      ],
      characteristics: {
        readability: 4,
        fileSize: 2,
        processingSpeed: 2
      }
    }
  ];

  const renderCharacteristicBar = (value: number, label: string, icon: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {icon}
      <Typography variant="caption" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5 }}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <Box
            key={dot}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: dot <= value ? 'primary.main' : 'grey.300'
            }}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Choose {operation === 'import' ? 'Import' : 'Export'} Format
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the format that best suits your needs. Consider factors like readability, 
        file size, and processing requirements.
      </Typography>

      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <RadioGroup
          value={selectedFormat}
          onChange={(e) => onFormatSelect(e.target.value)}
        >
          <Grid container spacing={3}>
            {formatOptions.map((option) => (
              <Grid item xs={12} md={4} key={option.format}>
                <Card
                  variant={selectedFormat === option.format ? "outlined" : "elevation"}
                  sx={{
                    height: '100%',
                    border: selectedFormat === option.format ? 2 : 1,
                    borderColor: selectedFormat === option.format ? 'primary.main' : 'divider'
                  }}
                >
                  <CardActionArea
                    onClick={() => onFormatSelect(option.format)}
                    sx={{ height: '100%', p: 0 }}
                  >
                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControlLabel
                          value={option.format}
                          control={<Radio />}
                          label=""
                          sx={{ mr: 1 }}
                        />
                        {option.icon}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="h6">{option.name}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {option.extensions.map((ext) => (
                              <Chip key={ext} label={ext} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {option.description}
                      </Typography>

                      {/* Characteristics */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Characteristics
                        </Typography>
                        {renderCharacteristicBar(
                          option.characteristics.readability,
                          'Readable',
                          <ReadabilityIcon sx={{ fontSize: 16 }} />
                        )}
                        {renderCharacteristicBar(
                          6 - option.characteristics.fileSize, // Invert scale for file size
                          'Compact',
                          <SizeIcon sx={{ fontSize: 16 }} />
                        )}
                        {renderCharacteristicBar(
                          option.characteristics.processingSpeed,
                          'Fast',
                          <SpeedIcon sx={{ fontSize: 16 }} />
                        )}
                      </Paper>

                      {/* Best For */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Best for:
                        </Typography>
                        <List dense>
                          {option.bestFor.slice(0, 3).map((item, index) => (
                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 20 }}>
                                <CheckIcon sx={{ fontSize: 16 }} color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={item}
                                primaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      {/* Selection indicator */}
                      {selectedFormat === option.format && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'primary.main',
                            borderRadius: '50%',
                            p: 0.5
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </RadioGroup>
      </FormControl>

      {/* Detailed comparison */}
      {selectedFormat && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {formatOptions.find(f => f.format === selectedFormat)?.name} - Detailed Information
            </Typography>
            
            {formatOptions
              .filter(option => option.format === selectedFormat)
              .map(option => (
                <Grid container spacing={3} key={option.format}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Advantages
                    </Typography>
                    <List dense>
                      {option.pros.map((pro, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <CheckIcon sx={{ fontSize: 16 }} color="success" />
                          </ListItemIcon>
                          <ListItemText primary={pro} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Considerations
                    </Typography>
                    <List dense>
                      {option.cons.map((con, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Box sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              backgroundColor: 'warning.main',
                              ml: 0.5
                            }} />
                          </ListItemIcon>
                          <ListItemText primary={con} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};