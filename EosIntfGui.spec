Summary: EOS HTML Interface Viewer
Name: EosIntfGui
Version: 0.4
Release: 1
License: Arista Networks
Group: EOS/Extension
Source0: %{name}-%{version}-%{release}.tar
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}.tar
BuildArch: x86_64

%description
This EOS extenstion will create a HTML GUI for your switch to monitor 
interfaces and make minor configuration changes to the ports. 

%prep
%setup -q -n %{name}-%{version}-%{release}

%build

%install
mkdir -p $RPM_BUILD_ROOT/etc/nginx/external_conf
mkdir -p $RPM_BUILD_ROOT/usr/share/nginx/html/apps/EosIntfs
mkdir -p $RPM_BUILD_ROOT/usr/bin
mkdir -p $RPM_BUILD_ROOT/usr/lib/python2.7/site-packages
cp etc/nginx/external_conf/EosIntfs.conf $RPM_BUILD_ROOT/etc/nginx/external_conf/
cp scripts/swIntf.py $RPM_BUILD_ROOT/usr/bin/swIntf
cp -r usr/share/nginx/html/apps/EosIntfs $RPM_BUILD_ROOT/usr/share/nginx/html/apps/EosIntfs
#pip install -t $RPM_BUILD_ROOT/usr/lib/python2.7/site-packages/ tornado
cp -r usr/lib/python2.7/site-packages/* $RPM_BUILD_ROOT/usr/lib/python2.7/site-packages/

%files
%defattr(-,root,root,-)
/usr/bin/swIntf
/usr/lib/python2.7/site-packages
/usr/share/nginx/html/apps/EosIntfs
/etc/nginx/external_conf/EosIntfs.conf
%attr(0755,root,root) /usr/bin/swIntf
