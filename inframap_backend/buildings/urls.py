from django.contrib import admin
from django.urls import path

from .views import *

app_name = 'buildings'
urlpatterns = [
	path('get-schools/', GetSchools.as_view(), name='School List'),
	path('get-clinics/', ClinicsByDistrictAPI.as_view(), name='clinics_api'),
	path('find-gaps/', FindGapZones.as_view(), name='Find School Gaps'),

]