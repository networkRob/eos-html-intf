Summary: EOS HTML Interface Viewer
Name: EosIntfGui
Version: 0.15
Release: 1
License: Arista Networks
Group: EOS/Extension
Source0: %{name}-%{version}-%{release}.tar
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}.tar
BuildArch: noarch

%description
This EOS extenstion will create a HTML GUI for your switch to monitor 
interfaces and make minor configuration changes to the ports. 

%prep
%setup -q -n source

%build

%install
mkdir -p $RPM_BUILD_ROOT/etc/nginx/external_conf
mkdir -p $RPM_BUILD_ROOT/usr/bin
mkdir -p $RPM_BUILD_ROOT/usr/lib/python2.7/site-packages
mkdir -p $RPM_BUILD_ROOT/opt/EosIntfs
cp etc/nginx/external_conf/EosIntfs.conf $RPM_BUILD_ROOT/etc/nginx/external_conf/
cp scripts/swIntf.py $RPM_BUILD_ROOT/usr/bin/swIntf
cp -r usr/lib/python2.7/site-packages/* $RPM_BUILD_ROOT/usr/lib/python2.7/site-packages/
cp -r opt/EosIntfs/* $RPM_BUILD_ROOT/opt/EosIntfs/

%files
%defattr(-,root,root,-)
/usr/bin/swIntf
/usr/lib/python2.7/site-packages
/etc/nginx/external_conf/EosIntfs.conf
/opt/EosIntfs
%attr(0755,root,root) /usr/bin/swIntf
