# Clinical Trial Table Metadata System

A comprehensive platform for creating, managing, and standardizing analysis metadata for clinical trials according to the CDISC Analysis Results Standard (ARS).

## 🎯 Key Features

- **Standards Compliant**: Built on CDISC Analysis Results Standard (ARS)
- **User-Friendly**: Intuitive wizards and visual designers
- **Collaborative**: Real-time collaboration with version control
- **Extensible**: API-first architecture with comprehensive integrations
- **Scalable**: From single-user to enterprise deployments

## 🚀 Quick Start

Get up and running in minutes:

```bash
# Clone the repository
git clone https://github.com/cdisc-org/analysis-results-standard.git
cd analysis-results-standard

# Quick setup
./setup-infrastructure.sh all

# Start the application
./deploy.sh dev start
```

Access the application at http://localhost:3000

**New to the system?** Check out our [Quick Start Guide](docs/QUICK_START.md) for a 15-minute tutorial.

## 📚 Documentation

| Resource | Description |
|----------|-------------|
| **[Quick Start Guide](docs/QUICK_START.md)** | 15-minute tutorial to get started |
| **[User Guide](docs/USER_GUIDE.md)** | Complete feature documentation |
| **[Installation Guide](docs/INSTALLATION.md)** | Setup and configuration |
| **[API Documentation](docs/API_DOCUMENTATION.md)** | Developer reference |
| **[FAQ](docs/FAQ.md)** | Common questions and answers |

[📖 View All Documentation](docs/)

## 🏗️ Architecture

The system consists of:
- **Frontend**: React/TypeScript application
- **Backend**: FastAPI with Python
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for performance
- **Deployment**: Docker and Kubernetes ready

## 🎯 Use Cases

### For Statistical Programmers
- Create standardized analysis specifications
- Generate programming code templates
- Validate analysis compliance
- Export to SAS/R/Python formats

### For Biostatisticians
- Design analysis plans visually
- Collaborate on statistical methods
- Review and approve specifications
- Ensure regulatory compliance

### For Data Managers
- Standardize analysis metadata
- Manage template libraries
- Track analysis lineage
- Export for submissions

## 🚦 Project Status

- ✅ **Phase 1**: Foundation (Complete)
- ✅ **Phase 2**: Core Features (Complete) 
- ✅ **Phase 3**: Advanced Features (Complete)
- ✅ **Phase 4**: Polish & Deploy (Complete)

Current version: **v1.0** - Production Ready

## 🛠️ Technology Stack

**Backend:**
- Python 3.11+
- FastAPI
- PostgreSQL
- Redis
- Docker

**Frontend:**
- React 18+
- TypeScript
- Ant Design
- Vite

**Infrastructure:**
- Docker Compose
- Kubernetes
- GitHub Actions
- Monitoring & Logging

## 📋 System Requirements

**Minimum:**
- 4 GB RAM
- 20 GB storage
- Modern web browser

**Recommended:**
- 8+ GB RAM
- 100+ GB SSD
- High-speed internet

## 🔧 Installation Options

### Docker Compose (Recommended)
```bash
./deploy.sh dev start
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Cloud Deployment
Supports AWS, Azure, GCP with managed services.

See [Installation Guide](docs/INSTALLATION.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 🔐 Security

- Industry-standard encryption
- Role-based access control
- Audit logging
- GDPR/HIPAA compliance ready
- Regular security updates

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/cdisc-org/analysis-results-standard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cdisc-org/analysis-results-standard/discussions)
- **Community**: [CDISC Community](https://www.cdisc.org/)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 CDISC Analysis Results Standard

The goals of CDISC Analysis Results Standards team is to develop:
  - Analysis Results Metadata Technical Specification (ARM-TS), to support automation, traceability, and creation of data displays
  - Define an Analysis Results Data (ARD) structure, to support reuse and reproducibility of results data
  - Illustrate and exercise ARD and ARM-TS with a set of machine-readable common safety displays 
  - Develop a logical analysis results metamodel to support ARM and ARD
    - Including model definition
    - User Guide
    - API development
    - Conformance rules
    - Terminology

## Background

  - Unnecessary variation in analysis results reporting
  - Limited CDISC standards to support analysis results and associated metadata
  - CDISC has been working towards creating standards to support, consistency, traceability, and reuse of results data
  - We anticipate that the CDISC work will support sponsor submissions of analysis results in a standard format that aligns with the FDA effort

## Analysis Results Current State

- Static results created for Clinical Study Report
- May be hundred of tables in PDF format, often difficult to navigate
- Variability between sponsors 
- Expensive to generate and only used once, no or limited reusability 
- ARM v1.0 describes metadata about analysis displays and results (at a high level), no formal analysis and results model or results data
- Lack of features to drive automation 
- Limited regulatory use cases 
- Limited traceability 

![Analysis Results Current State](images/AR-current-state.png)

## Analysis Results Future State
  - Formal model for describing analyses and results as data
  - Facilitate automated generation of results
  - From static to machine readable results
  - Improved navigation and reusability of analyses and results
  - Support storage, access, processing and reproducibility of results 
  - Traceability to Protocol/SAP and to input ADaM data 
  - Open-source tools to design, specify, build and generate analysis results
 
![Analysis Results Future State](images/AR-future-state.png)

## Documentation

The documentation of the model is made available at: https://cdisc-org.github.io/analysis-results-standard/

## Reference CDISC Pilot Study Material

The study documents and datasets referenced/utilized by the ARS development team is available at: https://github.com/cdisc-org/sdtm-adam-pilot-project 

## Contribution

Project Contact: 
- Bhavin Busa (https://github.com/bhavinbusa): Product Owner and Co-lead
- Bess LeRoy (https://github.com/bessleroy): Co-lead
- Richard Marshall (https://github.com/ASL-rmarshall): ARS model developer
- Drew Mills (https://github.com/drewcdisc): Scrum Master

Contribution is very welcome. When you contribute to this repository you are doing so under the below licenses. Please checkout [Contribution](CONTRIBUTING.md) for additional information. All contributions must adhere to the following [Code of Conduct](CODE_OF_CONDUCT.md).

## License

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) ![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-blue.svg)

### Code & Scripts

This project is using the [MIT](http://www.opensource.org/licenses/MIT "The MIT License | Open Source Initiative") license (see [`LICENSE`](LICENSE)) for code and scripts.

### Content

The content files like documentation and minutes are released under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). This does not include trademark permissions.

## Re-use

When you re-use the source, keep or copy the license information also in the source code files. When you re-use the source in proprietary software or distribute binaries (derived or underived), copy additionally the license text to a third-party-licenses file or similar.

When you want to re-use and refer to the content, please do so like the following:

> Content based on [Project CDISC Analysis Results Standards (GitHub)](https://github.com/cdisc-org/analysis-results-standard) used under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) license.
