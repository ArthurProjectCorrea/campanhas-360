using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;

namespace Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Client> Clients { get; set; }
    public DbSet<AccessProfile> AccessProfiles { get; set; }
    public DbSet<Screen> Screens { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<Access> Accesses { get; set; }
    public DbSet<TseCandidate> TseCandidates { get; set; }
    public DbSet<Schooling> Schoolings { get; set; }
    public DbSet<Gender> Genders { get; set; }
    public DbSet<MaritalStatus> MaritalStatuses { get; set; }
    public DbSet<ColorRace> ColorRaces { get; set; }
    public DbSet<Occupation> Occupations { get; set; }
    public DbSet<Party> Parties { get; set; }
    public DbSet<Position> Positions { get; set; }
    public DbSet<Region> Regions { get; set; }
    public DbSet<State> States { get; set; }
    public DbSet<Mesoregion> Mesoregions { get; set; }
    public DbSet<Microregion> Microregions { get; set; }
    public DbSet<IntermediateRegion> IntermediateRegions { get; set; }
    public DbSet<ImmediateRegion> ImmediateRegions { get; set; }
    public DbSet<Municipality> Municipalities { get; set; }
    public DbSet<Candidate> Candidates { get; set; }
    public DbSet<Campaign> Campaigns { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Habilita a extensão espacial PostGIS
        builder.HasPostgresExtension("postgis");

        // Configuração para evitar duplicados na importação do TSE
        builder.Entity<TseCandidate>()
            .HasIndex(t => t.SQ_CANDIDATO)
            .IsUnique();

        builder.Entity<Client>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.Domain).IsRequired();
        });

        builder.Entity<AccessProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.HasOne(d => d.Client)
                .WithMany(p => p.AccessProfiles)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Screen>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever(); // IDs coming from JSON
            entity.Property(e => e.Key).IsRequired();
            entity.HasIndex(e => e.Key).IsUnique();
        });

        builder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever(); // IDs coming from JSON
            entity.Property(e => e.Key).IsRequired();
            entity.HasIndex(e => e.Key).IsUnique();
        });

        builder.Entity<Access>(entity =>
        {
            entity.HasKey(e => new { e.AccessProfileId, e.ScreenId, e.PermissionId });

            entity.HasOne(d => d.AccessProfile)
                .WithMany(p => p.Accesses)
                .HasForeignKey(d => d.AccessProfileId);

            entity.HasOne(d => d.Screen)
                .WithMany(p => p.Accesses)
                .HasForeignKey(d => d.ScreenId);

            entity.HasOne(d => d.Permission)
                .WithMany(p => p.Accesses)
                .HasForeignKey(d => d.PermissionId);
        });

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.HasOne(d => d.Client)
                .WithMany(p => p.Users)
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.AccessProfile)
                .WithMany(p => p.Users)
                .HasForeignKey(d => d.AccessProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Candidate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(d => d.Client)
                .WithMany()
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Campaign>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(d => d.Candidate)
                .WithMany(p => p.Campaigns)
                .HasForeignKey(d => d.CandidateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Position)
                .WithMany()
                .HasForeignKey(d => d.PositionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.State)
                .WithMany()
                .HasForeignKey(d => d.StateId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Municipality)
                .WithMany()
                .HasForeignKey(d => d.MunicipalityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Party)
                .WithMany()
                .HasForeignKey(d => d.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Client)
                .WithMany()
                .HasForeignKey(d => d.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
